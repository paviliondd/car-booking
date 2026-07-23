import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { VehiclesService } from '../vehicles/vehicles.service';
import { PaymentsService } from '../payments/payments.service';
import { NotificationService } from '../notification/notification.service';
import { BookingQuoteDto, CreateBookingDto } from './dto/booking.dto';
import {
  BookingStatus,
  PaymentStatus,
  Prisma,
  VehicleStatus,
} from '@prisma/client';
import { AuthenticatedUser } from '../auth/types/authenticated-user';
import { LocalStorageService } from '../storage/local-storage.service';
import { canTransitionBooking } from './booking-status';

type BookingDetails = Prisma.BookingGetPayload<{
  include: {
    customer: { include: { user: true } };
    vehicle: true;
    payment: true;
  };
}>;

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
    private vehiclesService: VehiclesService,
    private paymentsService: PaymentsService,
    private notificationService: NotificationService,
    private localStorage: LocalStorageService,
  ) {}

  async quote(dto: BookingQuoteDto) {
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      start >= end
    ) {
      throw new BadRequestException(
        'Thời gian nhận xe phải trước thời gian trả xe',
      );
    }

    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: dto.vehicleId },
    });
    if (!vehicle) {
      throw new NotFoundException('Không tìm thấy xe yêu cầu');
    }
    if (vehicle.status !== VehicleStatus.AVAILABLE) {
      throw new BadRequestException('Xe hiện không sẵn sàng để đặt');
    }

    const conflict = await this.prisma.booking.findFirst({
      where: {
        vehicleId: dto.vehicleId,
        status: { in: ['CONFIRMED', 'RENTING', 'PENDING'] },
        NOT: {
          OR: [{ endDate: { lte: start } }, { startDate: { gte: end } }],
        },
      },
      select: { id: true },
    });
    if (conflict) {
      throw new BadRequestException('Xe đã có lịch trong khoảng thời gian này');
    }

    const pricing = this.vehiclesService.calculateTotalPrice(
      vehicle,
      start,
      end,
    );
    let discountAmount = 0;
    let couponMessage: string | null = null;
    if (dto.couponCode) {
      const coupon = await this.prisma.coupon.findUnique({
        where: { code: dto.couponCode },
      });
      const now = new Date();
      if (
        !coupon ||
        now < coupon.startDate ||
        now > coupon.endDate ||
        coupon.usedCount >= coupon.usageLimit ||
        pricing.totalPrice < coupon.minOrderValue
      ) {
        couponMessage = 'Mã giảm giá không hợp lệ hoặc chưa đủ điều kiện';
      } else {
        discountAmount =
          coupon.discountType === 'PERCENTAGE'
            ? (pricing.totalPrice * coupon.value) / 100
            : coupon.value;
        if (coupon.maxDiscount) {
          discountAmount = Math.min(discountAmount, coupon.maxDiscount);
        }
        discountAmount = Math.min(discountAmount, pricing.totalPrice);
      }
    }

    const insuranceRates = { NONE: 0, BASIC: 100000, PREMIUM: 250000 };
    const insuranceFee =
      insuranceRates[dto.insuranceType as keyof typeof insuranceRates] *
      pricing.totalDays;
    const totalPrice = pricing.totalPrice - discountAmount + insuranceFee;
    const depositAmount = Math.round(totalPrice * (dto.depositPercent / 100));

    return {
      available: true,
      vehicleId: vehicle.id,
      totalDays: pricing.totalDays,
      basePrice: pricing.totalPrice,
      priceDetails: pricing.details,
      discountAmount,
      insuranceFee,
      totalPrice,
      depositPercent: dto.depositPercent,
      depositAmount,
      couponMessage,
    };
  }

  async createBooking(dto: CreateBookingDto, actor: AuthenticatedUser) {
    const lockKey = `vehicle:${dto.vehicleId}`;
    this.logger.log(`Acquiring lock for ${lockKey}`);

    // 1. Acquire Distributed Lock (Redis) - Hạn chế race condition trùng lịch
    const locked = await this.redisService.acquireLock(lockKey, 5000);
    if (!locked) {
      throw new BadRequestException(
        'Hệ thống đang xử lý yêu cầu đặt xe này. Vui lòng quay lại sau vài giây!',
      );
    }

    try {
      const start = new Date(dto.startDate);
      const end = new Date(dto.endDate);

      // 2. Validate Vehicle Existence and Status
      const vehicle = await this.prisma.vehicle.findUnique({
        where: { id: dto.vehicleId },
      });
      if (!vehicle) {
        throw new NotFoundException('Không tìm thấy xe yêu cầu');
      }
      if (vehicle.status === 'LOCKED' || vehicle.status === 'MAINTENANCE') {
        throw new BadRequestException(
          'Xe hiện tại không sẵn sàng để cho thuê (đang khóa hoặc bảo dưỡng)',
        );
      }

      // 3. Double-check conflict in Database
      const conflict = await this.prisma.booking.findFirst({
        where: {
          vehicleId: dto.vehicleId,
          status: { in: ['CONFIRMED', 'RENTING', 'PENDING'] },
          NOT: {
            OR: [{ endDate: { lte: start } }, { startDate: { gte: end } }],
          },
        },
      });

      if (conflict) {
        throw new BadRequestException(
          'Xe đã bị đặt hoặc đang trong chuyến đi khác vào thời gian này. Vui lòng chọn xe khác!',
        );
      }

      // 4. Find or Create Customer Profile (CRM & Segmentation)
      const documentKeys = [
        dto.idCardFront,
        dto.idCardBack,
        dto.driverLicense,
      ].filter((key): key is string => Boolean(key));
      for (const key of documentKeys) {
        if (!(await this.localStorage.privateKeyExists(key, actor.id))) {
          throw new BadRequestException(
            'Tệp hồ sơ không tồn tại hoặc không hợp lệ',
          );
        }
      }

      let customer = await this.prisma.customer.findFirst({
        where: { OR: [{ userId: actor.id }, { phone: dto.phone }] },
      });

      if (!customer) {
        // Tự động phân loại dựa trên dữ liệu mới
        customer = await this.prisma.customer.create({
          data: {
            fullName: dto.fullName,
            phone: dto.phone,
            idCardNo: dto.idCardNo,
            userId: actor.id,
            idCardFront: dto.idCardFront,
            idCardBack: dto.idCardBack,
            driverLicense: dto.driverLicense,
            segment: 'REGULAR',
          },
        });
      } else {
        if (customer.userId && customer.userId !== actor.id) {
          throw new BadRequestException(
            'Số điện thoại này đã thuộc về một tài khoản khác',
          );
        }
        if (customer.segment === 'BLACKLIST') {
          throw new BadRequestException(
            'Tài khoản của bạn nằm trong danh sách đen (Blacklist). Vui lòng liên hệ Hotline.',
          );
        }
        // Cập nhật thông tin mới nhất
        customer = await this.prisma.customer.update({
          where: { id: customer.id },
          data: {
            fullName: dto.fullName,
            phone: dto.phone,
            idCardNo: dto.idCardNo,
            userId: actor.id,
            ...(dto.idCardFront ? { idCardFront: dto.idCardFront } : {}),
            ...(dto.idCardBack ? { idCardBack: dto.idCardBack } : {}),
            ...(dto.driverLicense ? { driverLicense: dto.driverLicense } : {}),
          },
        });
      }

      // 5. Calculate Base Price via Dynamic Pricing Module
      const pricing = this.vehiclesService.calculateTotalPrice(
        vehicle,
        start,
        end,
      );
      let totalPrice = pricing.totalPrice;
      let discountAmount = 0;

      // 6. Apply Coupon (Mã giảm giá)
      if (dto.couponCode) {
        const coupon = await this.prisma.coupon.findUnique({
          where: { code: dto.couponCode },
        });

        if (coupon) {
          const now = new Date();
          if (
            now >= coupon.startDate &&
            now <= coupon.endDate &&
            coupon.usedCount < coupon.usageLimit
          ) {
            if (pricing.totalPrice >= coupon.minOrderValue) {
              if (coupon.discountType === 'PERCENTAGE') {
                discountAmount = (pricing.totalPrice * coupon.value) / 100;
                if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
                  discountAmount = coupon.maxDiscount;
                }
              } else if (coupon.discountType === 'FIXED_AMOUNT') {
                discountAmount = coupon.value;
              }

              totalPrice = Math.max(0, pricing.totalPrice - discountAmount);

              // Cập nhật số lần dùng coupon
              await this.prisma.coupon.update({
                where: { code: dto.couponCode },
                data: { usedCount: { increment: 1 } },
              });
            }
          }
        }
      }

      // 7. Affiliate (Cộng tác viên)
      if (dto.affiliateCode) {
        const affiliate = await this.prisma.affiliate.findUnique({
          where: { code: dto.affiliateCode },
        });
        if (affiliate) {
          // Cập nhật referrer của customer
          await this.prisma.customer.update({
            where: { id: customer.id },
            data: { affiliateId: affiliate.id },
          });
        }
      }

      // 7.1. Calculate Insurance Fee and Deposit Amount
      const insType = dto.insuranceType || 'NONE';
      let insFee = 0;
      if (insType === 'BASIC') {
        insFee = 100000 * pricing.totalDays; // 100K/day
      } else if (insType === 'PREMIUM') {
        insFee = 250000 * pricing.totalDays; // 250K/day
      }

      const depPercent = dto.depositPercent || 30.0;
      const depAmount = (totalPrice + insFee) * (depPercent / 100);

      // 8. Generate Booking Number
      const bookingNumber = `BK-${Date.now().toString().slice(-6)}-${Math.floor(10 + Math.random() * 90)}`;

      // 9. Save Booking & Payment in Transaction
      const result = await this.prisma.$transaction(async (tx) => {
        const booking = await tx.booking.create({
          data: {
            bookingNumber,
            customerId: customer.id,
            vehicleId: dto.vehicleId,
            startDate: start,
            endDate: end,
            pickupLocation: dto.pickupLocation,
            dropoffLocation: dto.dropoffLocation,
            totalDays: pricing.totalDays,
            basePrice: pricing.totalPrice,
            discountAmount,
            totalPrice,
            status: BookingStatus.PENDING,
            notes: dto.notes,
            couponCode: dto.couponCode,
            insuranceType: insType,
            insuranceFee: insFee,
            depositPercent: depPercent,
            depositAmount: depAmount,
          },
        });

        const payment = await tx.payment.create({
          data: {
            bookingId: booking.id,
            amount: depAmount,
            status: PaymentStatus.UNPAID,
            method: dto.paymentMethod,
          },
        });

        return { booking, payment };
      });

      // 10. Generate Gateway Payment Link (MoMo / PayOS / VietQR)
      const payGateway = await this.paymentsService.createPaymentUrl(
        result.booking.id,
        result.payment.amount,
        dto.paymentMethod,
      );

      // Cập nhật mã giao dịch trong payment
      await this.prisma.payment.update({
        where: { bookingId: result.booking.id },
        data: { transactionId: payGateway.transactionId },
      });

      // 11. Send AWS Notifications (SES / SNS)
      const emailContent = `
        <h3>Xác nhận đặt xe tự lái thành công</h3>
        <p>Xin chào ${dto.fullName},</p>
        <p>Mã đơn đặt xe của bạn là: <strong>${bookingNumber}</strong></p>
        <p>Xe: ${vehicle.brand} ${vehicle.model} - Biển số: ${vehicle.plateNumber}</p>
        <p>Thời gian: Từ ${dto.startDate} đến ${dto.endDate}</p>
        <p>Tổng tiền thanh toán: ${totalPrice.toLocaleString()} VND</p>
        <p>Vui lòng click vào link sau để tiến hành đặt cọc/thanh toán: <a href="${payGateway.paymentUrl}">Thanh toán ngay</a></p>
      `;
      await this.notificationService.sendEmail(
        dto.email,
        `[datxe] Xác nhận đặt xe ${bookingNumber}`,
        emailContent,
      );

      const smsContent = `datxe: Dat xe ${bookingNumber} thanh cong cho xe ${vehicle.brand}. Vui long thanh toan: ${payGateway.paymentUrl}`;
      await this.notificationService.sendSMS(dto.phone, smsContent);

      return {
        booking: result.booking,
        paymentUrl: payGateway.paymentUrl,
        transactionId: payGateway.transactionId,
      };
    } finally {
      // 12. Release Lock
      this.logger.log(`Releasing lock for ${lockKey}`);
      await this.redisService.releaseLock(lockKey);
    }
  }

  async trackBookings(phone: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { phone },
    });
    if (!customer) {
      return [];
    }

    return await this.prisma.booking.findMany({
      where: { customerId: customer.id },
      include: {
        vehicle: true,
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAll() {
    return await this.prisma.booking.findMany({
      include: {
        customer: true,
        vehicle: true,
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<BookingDetails> {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        customer: { include: { user: true } },
        vehicle: true,
        payment: true,
      },
    });
    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }
    return booking;
  }

  async findOwnerBookings(ownerId: string) {
    return await this.prisma.booking.findMany({
      where: {
        vehicle: { ownerId },
      },
      include: {
        customer: true,
        vehicle: true,
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Cập nhật trạng thái đơn (Duyệt, từ chối, nhận xe, trả xe) & Log Audit
  async updateStatus(
    id: string,
    status: BookingStatus,
    user: AuthenticatedUser,
  ) {
    const currentBooking = await this.findOne(id);

    if (currentBooking.status === status) return currentBooking;

    if (!canTransitionBooking(currentBooking.status, status)) {
      throw new BadRequestException(
        `Không thể chuyển đơn từ ${currentBooking.status} sang ${status}.`,
      );
    }

    // Nếu người thực hiện là OWNER, kiểm tra xem họ có sở hữu xe của đơn đặt này hay không
    if (user.role === 'OWNER') {
      if (currentBooking.vehicle.ownerId !== user.id) {
        throw new BadRequestException(
          'Bạn không sở hữu phương tiện của đơn đặt xe này.',
        );
      }
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      // 1. Cập nhật booking
      const book = await tx.booking.update({
        where: { id },
        data: {
          status,
          staffId: user.id,
        },
      });

      // 2. Cập nhật trạng thái xe tương ứng
      if (status === BookingStatus.RENTING) {
        await tx.vehicle.update({
          where: { id: currentBooking.vehicleId },
          data: { status: VehicleStatus.RENTED },
        });
      } else if (
        status === BookingStatus.COMPLETED ||
        status === BookingStatus.CANCELLED
      ) {
        const otherActiveRental = await tx.booking.count({
          where: {
            id: { not: id },
            vehicleId: currentBooking.vehicleId,
            status: BookingStatus.RENTING,
          },
        });
        if (otherActiveRental === 0) {
          const vehicle = await tx.vehicle.findUnique({
            where: { id: currentBooking.vehicleId },
          });
          if (vehicle?.status === VehicleStatus.RENTED) {
            await tx.vehicle.update({
              where: { id: currentBooking.vehicleId },
              data: { status: VehicleStatus.AVAILABLE },
            });
          }
        }
      }

      // 3. Xử lý Affiliate Commission nếu booking hoàn thành
      if (
        status === BookingStatus.COMPLETED &&
        currentBooking.customer.affiliateId
      ) {
        const affiliate = await tx.affiliate.findUnique({
          where: { id: currentBooking.customer.affiliateId },
        });
        if (affiliate) {
          const commission =
            currentBooking.totalPrice * affiliate.commissionRate;
          await tx.affiliate.update({
            where: { id: affiliate.id },
            data: { balance: { increment: commission } },
          });
        }
      }

      // 4. Ghi Audit Log hệ thống
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: `UPDATE_STATUS_${status}`,
          targetTable: 'Booking',
          targetId: id,
          oldValue: { status: currentBooking.status },
          newValue: { status },
        },
      });

      return book;
    });

    // 5. Gửi thông báo SMS / Email khi đổi trạng thái đơn
    const customerPhone = currentBooking.customer.phone;
    if (status === BookingStatus.CONFIRMED) {
      await this.notificationService.sendSMS(
        customerPhone,
        `datxe: Don hang ${currentBooking.bookingNumber} da duoc XAC NHAN. Hen gap ban luc nhan xe.`,
      );
    }

    return updated;
  }
}
