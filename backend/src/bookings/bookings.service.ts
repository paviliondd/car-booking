import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { VehiclesService } from '../vehicles/vehicles.service';
import { PaymentsService } from '../payments/payments.service';
import { NotificationService } from '../notification/notification.service';
import {
  BookingQuoteDto,
  CreateAdminBookingDto,
  CreateBookingDto,
} from './dto/booking.dto';
import {
  BookingStatus,
  PaymentStatus,
  Prisma,
  QuickBookingStatus,
  VehicleStatus,
} from '@prisma/client';
import { AuthenticatedUser } from '../auth/types/authenticated-user';
import { LocalStorageService } from '../storage/local-storage.service';
import { canTransitionBooking } from './booking-status';
import { RENTAL_LOCATION } from '../common/rental-location';
import { ConfigService } from '@nestjs/config';
import {
  bookingCustomerEmail,
  bookingOwnerEmail,
} from '../notification/mail-templates';
import { normalizeVietnamesePhone } from '../common/phone';

type BookingDetails = Prisma.BookingGetPayload<{
  include: {
    customer: { include: { user: true } };
    vehicle: true;
    payment: true;
  };
}>;

@Injectable()
export class BookingsService implements OnModuleInit {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
    private vehiclesService: VehiclesService,
    private paymentsService: PaymentsService,
    private notificationService: NotificationService,
    private localStorage: LocalStorageService,
    private config: ConfigService,
  ) {}

  onModuleInit() {
    setInterval(() => {
      this.cancelExpiredPendingBookings().catch((err) =>
        this.logger.error('Lỗi khi quét dọn đơn PENDING quá hạn:', err),
      );
    }, 120_000);
  }

  async cancelExpiredPendingBookings() {
    const cutoff = new Date(Date.now() - 15 * 60_000);
    const expiredBookings = await this.prisma.booking.findMany({
      where: {
        status: BookingStatus.PENDING,
        createdAt: { lte: cutoff },
        payment: { status: PaymentStatus.UNPAID },
      },
      select: { id: true, bookingNumber: true },
    });

    for (const booking of expiredBookings) {
      try {
        await this.prisma.$transaction([
          this.prisma.booking.update({
            where: { id: booking.id },
            data: { status: BookingStatus.CANCELLED },
          }),
          this.prisma.auditLog.create({
            data: {
              action: 'AUTO_CANCEL_EXPIRED_UNPAID_BOOKING',
              targetTable: 'Booking',
              targetId: booking.id,
              oldValue: { status: BookingStatus.PENDING },
              newValue: {
                status: BookingStatus.CANCELLED,
                reason:
                  'Tự động hủy do quá thời hạn 15 phút chưa cọc thanh toán',
              },
            },
          }),
        ]);
        this.logger.log(
          `Tự động hủy đơn PENDING quá hạn thanh toán cọc: ${booking.bookingNumber}`,
        );
      } catch (error) {
        this.logger.error(
          `Không thể tự động hủy đơn ${booking.bookingNumber}`,
          error,
        );
      }
    }
  }

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
    if (start.getTime() < Date.now() - 5 * 60_000) {
      throw new BadRequestException('Thời gian nhận xe phải ở tương lai');
    }

    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: dto.vehicleId },
    });
    if (!vehicle) {
      throw new NotFoundException('Không tìm thấy xe yêu cầu');
    }
    if (
      vehicle.status === VehicleStatus.LOCKED ||
      vehicle.status === VehicleStatus.MAINTENANCE
    ) {
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
    if (!actor.phone || !actor.phoneVerifiedAt) {
      throw new BadRequestException(
        'Bạn cần xác minh số điện thoại trong tài khoản trước khi đặt xe',
      );
    }
    const requestedPhone = dto.phone.replace(/[\s.-]/g, '');
    const normalizedRequestedPhone = requestedPhone.startsWith('+84')
      ? requestedPhone
      : requestedPhone.startsWith('84')
        ? `+${requestedPhone}`
        : requestedPhone.startsWith('0')
          ? `+84${requestedPhone.slice(1)}`
          : requestedPhone;
    if (normalizedRequestedPhone !== actor.phone) {
      throw new BadRequestException(
        'Số điện thoại đặt xe phải trùng với số đã xác minh của tài khoản',
      );
    }
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
    if (start.getTime() < Date.now() - 5 * 60_000) {
      throw new BadRequestException('Thời gian nhận xe phải ở tương lai');
    }
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
      // 2. Validate Vehicle Existence and Status
      const vehicle = await this.prisma.vehicle.findUnique({
        where: { id: dto.vehicleId },
        include: { owner: { select: { email: true } } },
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

      let customer = await this.prisma.customer.findUnique({
        where: { userId: actor.id },
      });

      if (!customer) {
        // Tự động phân loại dựa trên dữ liệu mới
        customer = await this.prisma.customer.create({
          data: {
            fullName: dto.fullName,
            phone: actor.phone,
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
            phone: actor.phone,
            idCardNo: dto.idCardNo,
            userId: actor.id,
            ...(dto.idCardFront ? { idCardFront: dto.idCardFront } : {}),
            ...(dto.idCardBack ? { idCardBack: dto.idCardBack } : {}),
            ...(dto.driverLicense ? { driverLicense: dto.driverLicense } : {}),
          },
        });
      }
      if (
        !customer.idCardFront ||
        !customer.idCardBack ||
        !customer.driverLicense
      ) {
        throw new BadRequestException(
          'Hồ sơ cần đủ CCCD mặt trước, mặt sau và giấy phép lái xe',
        );
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
            pickupLocation: RENTAL_LOCATION.address,
            dropoffLocation: RENTAL_LOCATION.address,
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

      const base =
        this.config.get<string>('PUBLIC_APP_URL') ||
        'https://datxe.linuxunity.com';
      const ownerEmail =
        vehicle.owner?.email ||
        this.config.get<string>('ADMIN_NOTIFICATION_EMAIL');
      await Promise.all([
        this.notificationService.sendEmail(
          dto.email,
          `[datxe] Xác nhận đặt xe ${bookingNumber}`,
          bookingCustomerEmail({
            name: dto.fullName,
            code: bookingNumber,
            vehicle: `${vehicle.brand} ${vehicle.model}`,
            plate: vehicle.plateNumber,
            start,
            end,
          }),
          'booking-customer',
          actor.id,
        ),
        ownerEmail
          ? this.notificationService.sendEmail(
              ownerEmail,
              `[datxe] Yêu cầu thuê xe ${bookingNumber}`,
              bookingOwnerEmail({
                code: bookingNumber,
                customer: dto.fullName,
                phone: dto.phone,
                vehicle: `${vehicle.brand} ${vehicle.model}`,
                start,
                end,
                dashboardUrl: `${base}/dashboard/bookings/${result.booking.id}`,
              }),
              'booking-owner',
            )
          : Promise.resolve(),
      ]);

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

  async createAdminBooking(
    dto: CreateAdminBookingDto,
    actor: AuthenticatedUser,
  ) {
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
    if (start.getTime() < Date.now() - 5 * 60_000) {
      throw new BadRequestException('Thời gian nhận xe phải ở tương lai');
    }

    const phone = normalizeVietnamesePhone(dto.phone);
    const lockKey = `vehicle:${dto.vehicleId}`;
    const locked = await this.redisService.acquireLock(lockKey, 10_000);
    if (!locked) {
      throw new BadRequestException(
        'Xe đang được xử lý bởi một yêu cầu khác. Vui lòng thử lại sau vài giây.',
      );
    }

    try {
      const vehicle = await this.prisma.vehicle.findUnique({
        where: { id: dto.vehicleId },
      });
      if (!vehicle) throw new NotFoundException('Không tìm thấy xe yêu cầu');
      if (
        vehicle.status === VehicleStatus.LOCKED ||
        vehicle.status === VehicleStatus.MAINTENANCE
      ) {
        throw new BadRequestException(
          'Xe đang khóa hoặc bảo dưỡng, chưa thể tạo đơn thuê',
        );
      }

      const sourceRequest = dto.quickBookingRequestId
        ? await this.prisma.quickBookingRequest.findUnique({
            where: { id: dto.quickBookingRequestId },
            include: { booking: true },
          })
        : null;
      if (dto.quickBookingRequestId && !sourceRequest) {
        throw new NotFoundException('Không tìm thấy yêu cầu đặt xe nhanh');
      }
      if (sourceRequest?.booking) {
        throw new BadRequestException(
          `Yêu cầu này đã được chuyển thành đơn ${sourceRequest.booking.bookingNumber}`,
        );
      }

      const conflict = await this.prisma.booking.findFirst({
        where: {
          vehicleId: dto.vehicleId,
          status: {
            in: [
              BookingStatus.PENDING,
              BookingStatus.CONFIRMED,
              BookingStatus.RENTING,
            ],
          },
          startDate: { lt: end },
          endDate: { gt: start },
        },
        select: { bookingNumber: true },
      });
      if (conflict) {
        throw new BadRequestException(
          `Xe đã bận trong khoảng thời gian này (${conflict.bookingNumber})`,
        );
      }

      const user = await this.prisma.user.findUnique({ where: { phone } });
      const matchedCustomers = await this.prisma.customer.findMany({
        where: {
          OR: [{ phone }, ...(user ? [{ userId: user.id }] : [])],
        },
      });
      if (matchedCustomers.length > 1) {
        throw new BadRequestException(
          'Số điện thoại đang liên kết với nhiều hồ sơ khách hàng. Vui lòng hợp nhất hồ sơ trước khi tạo đơn.',
        );
      }
      const currentCustomer = matchedCustomers[0];
      if (currentCustomer?.segment === 'BLACKLIST') {
        throw new BadRequestException(
          'Khách hàng nằm trong danh sách hạn chế, không thể tạo đơn thuê',
        );
      }

      const pricing = this.vehiclesService.calculateTotalPrice(
        vehicle,
        start,
        end,
      );
      const insuranceType = dto.insuranceType || 'NONE';
      const insuranceRate =
        insuranceType === 'PREMIUM'
          ? 250_000
          : insuranceType === 'BASIC'
            ? 100_000
            : 0;
      const insuranceFee = insuranceRate * pricing.totalDays;
      const totalPrice = pricing.totalPrice + insuranceFee;
      const depositPercent = dto.depositPercent || 30;
      const depositAmount = Math.round(totalPrice * (depositPercent / 100));
      const bookingNumber = `BK-${Date.now().toString().slice(-6)}-${Math.floor(10 + Math.random() * 90)}`;

      const result = await this.prisma.$transaction(async (tx) => {
        const customer = currentCustomer
          ? await tx.customer.update({
              where: { id: currentCustomer.id },
              data: {
                fullName: dto.fullName.trim(),
                phone,
                ...(user && !currentCustomer.userId ? { userId: user.id } : {}),
              },
            })
          : await tx.customer.create({
              data: {
                fullName: dto.fullName.trim(),
                phone,
                userId: user?.id,
                segment: 'REGULAR',
              },
            });

        const booking = await tx.booking.create({
          data: {
            bookingNumber,
            customerId: customer.id,
            vehicleId: vehicle.id,
            startDate: start,
            endDate: end,
            pickupLocation: RENTAL_LOCATION.address,
            dropoffLocation: RENTAL_LOCATION.address,
            totalDays: pricing.totalDays,
            basePrice: pricing.totalPrice,
            totalPrice,
            notes: dto.notes?.trim() || null,
            staffId: actor.id,
            insuranceType,
            insuranceFee,
            depositPercent,
            depositAmount,
            status: BookingStatus.PENDING,
          },
        });
        const payment = await tx.payment.create({
          data: {
            bookingId: booking.id,
            amount: depositAmount,
            method: dto.paymentMethod,
            status: PaymentStatus.UNPAID,
          },
        });

        let quickBookingRequest = null;
        if (sourceRequest) {
          quickBookingRequest = await tx.quickBookingRequest.update({
            where: { id: sourceRequest.id },
            data: {
              bookingId: booking.id,
              status: QuickBookingStatus.CLOSED,
              handledById: actor.id,
              contactedAt: sourceRequest.contactedAt || new Date(),
            },
            include: {
              vehicle: {
                select: {
                  id: true,
                  brand: true,
                  model: true,
                  plateNumber: true,
                  images: true,
                },
              },
              handledBy: { select: { id: true, name: true } },
              booking: {
                select: {
                  id: true,
                  bookingNumber: true,
                  status: true,
                },
              },
            },
          });
          await tx.auditLog.create({
            data: {
              userId: actor.id,
              action: 'CONVERT_QUICK_BOOKING',
              targetTable: 'QuickBookingRequest',
              targetId: sourceRequest.id,
              oldValue: {
                status: sourceRequest.status,
                bookingId: sourceRequest.bookingId,
              },
              newValue: {
                status: QuickBookingStatus.CLOSED,
                bookingId: booking.id,
              },
            },
          });
        }

        await tx.auditLog.create({
          data: {
            userId: actor.id,
            action: 'CREATE_BOOKING_BY_ADMIN',
            targetTable: 'Booking',
            targetId: booking.id,
            newValue: {
              bookingNumber,
              vehicleId: vehicle.id,
              customerId: customer.id,
              quickBookingRequestId: sourceRequest?.id,
            },
          },
        });

        return {
          booking: {
            ...booking,
            customer,
            vehicle,
            payment,
          },
          quickBookingRequest,
        };
      });

      try {
        await this.notificationService.sendSMS(
          phone,
          `datxe: Don ${bookingNumber} da duoc tao cho ${vehicle.brand} ${vehicle.model}, tu ${start.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })} den ${end.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}. Nhan vien se lien he de hoan tat thu tuc.`,
          'admin-booking-created',
          user?.id,
          `admin-booking-created:${result.booking.id}`,
        );
      } catch (error) {
        this.logger.warn(
          `Không thể gửi SMS cho đơn ${bookingNumber}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }

      return result;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException(
          'Yêu cầu đã được tạo đơn hoặc thông tin khách hàng đang bị trùng. Vui lòng tải lại dữ liệu.',
        );
      }
      throw error;
    } finally {
      await this.redisService.releaseLock(lockKey);
    }
  }

  async trackBookings(phone: string, bookingCode?: string) {
    if (!bookingCode || !bookingCode.trim()) {
      throw new BadRequestException(
        'Bạn cần cung cấp cả số điện thoại và mã đặt xe (Booking Code) để tra cứu thông tin đơn',
      );
    }
    const customer = await this.prisma.customer.findUnique({
      where: { phone: normalizeVietnamesePhone(phone) },
    });
    if (!customer) {
      return [];
    }

    return await this.prisma.booking.findMany({
      where: {
        customerId: customer.id,
        bookingNumber: bookingCode.trim(),
      },
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
    if (status === BookingStatus.CONFIRMED && customerPhone) {
      await this.notificationService.sendSMS(
        customerPhone,
        `datxe: Don ${currentBooking.bookingNumber} da hoan tat thu tuc. Nhan ${currentBooking.vehicle.brand} ${currentBooking.vehicle.model} luc ${currentBooking.startDate.toLocaleString('vi-VN')}, tra luc ${currentBooking.endDate.toLocaleString('vi-VN')} tai ${currentBooking.pickupLocation}.`,
        'booking-confirmed',
        currentBooking.customer.userId || undefined,
        `booking-confirmed:${currentBooking.id}`,
      );
    }

    return updated;
  }

  async deleteBooking(id: string, user: AuthenticatedUser) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        customer: true,
        vehicle: true,
        payment: true,
        contract: true,
      },
    });

    if (!booking) {
      throw new NotFoundException(`Không tìm thấy đơn hàng với ID ${id}`);
    }

    if (booking.status === BookingStatus.RENTING) {
      throw new BadRequestException(
        'Không thể xóa đơn hàng đang trong trạng thái Đang thuê (RENTING). Vui lòng kết thúc thuê hoặc hủy đơn trước khi xóa.',
      );
    }

    return await this.prisma.$transaction(async (tx) => {
      // 1. Xóa Payment nếu có
      await tx.payment.deleteMany({ where: { bookingId: id } });

      // 2. Xóa Contract nếu có
      await tx.contract.deleteMany({ where: { bookingId: id } });

      // 3. Xóa Revenue nếu có
      await tx.revenue.deleteMany({ where: { bookingId: id } });

      // 4. Gỡ bookingId khỏi QuickBookingRequest nếu có
      await tx.quickBookingRequest.updateMany({
        where: { bookingId: id },
        data: { bookingId: null },
      });

      // 5. Xóa Booking (VehicleInspection tự động cascade)
      const deleted = await tx.booking.delete({
        where: { id },
      });

      // 6. Ghi Audit Log
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'DELETE_BOOKING',
          targetTable: 'Booking',
          targetId: id,
          oldValue: {
            bookingNumber: booking.bookingNumber,
            status: booking.status,
            totalPrice: booking.totalPrice,
            customerId: booking.customerId,
            vehicleId: booking.vehicleId,
          },
        },
      });

      return {
        success: true,
        id: deleted.id,
        bookingNumber: deleted.bookingNumber,
      };
    });
  }
}
