import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BookingStatus,
  Prisma,
  QuickBookingSmsStatus,
  QuickBookingStatus,
  VehicleStatus,
} from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { maskPhone, normalizeVietnamesePhone } from '../common/phone';
import { NotificationService } from '../notification/notification.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateQuickBookingDto,
  ListQuickBookingsDto,
  UpdateQuickBookingDto,
} from './dto/quick-booking.dto';

const ACTIVE_BOOKING_STATUSES: BookingStatus[] = [
  BookingStatus.PENDING,
  BookingStatus.CONFIRMED,
  BookingStatus.RENTING,
];
const MAX_RENTAL_DAYS = 31;
const MAX_ADVANCE_DAYS = 365;

@Injectable()
export class QuickBookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationService,
    private readonly config: ConfigService,
  ) {}

  async create(dto: CreateQuickBookingDto) {
    const phone = normalizeVietnamesePhone(dto.phone);
    const { startDate, endDate } = this.validateDates(
      dto.startDate,
      dto.endDate,
    );
    await this.getAvailableVehicle(dto.vehicleId, startDate, endDate);

    const duplicate = await this.prisma.quickBookingRequest.findFirst({
      where: {
        phone,
        vehicleId: dto.vehicleId,
        startDate,
        endDate,
        createdAt: { gte: new Date(Date.now() - 10 * 60_000) },
      },
      include: { vehicle: true },
      orderBy: { createdAt: 'desc' },
    });
    if (duplicate) {
      return this.toPublicResponse(duplicate, true);
    }

    const request = await this.prisma.quickBookingRequest.create({
      data: {
        requestNumber: this.createRequestNumber(),
        phone,
        vehicleId: dto.vehicleId,
        startDate,
        endDate,
      },
      include: { vehicle: true },
    });

    const adminEmail = this.config.get<string>('ADMIN_NOTIFICATION_EMAIL');
    const [smsSent] = await Promise.all([
      this.deliverSms(request),
      adminEmail
        ? this.notifications.sendEmail(
            adminEmail,
            `Yêu cầu đặt xe nhanh ${request.requestNumber}`,
            this.adminEmailBody(request),
            'quick-booking-admin',
          )
        : Promise.resolve(),
    ]);

    return this.toPublicResponse(
      {
        ...request,
        smsStatus: smsSent
          ? QuickBookingSmsStatus.SENT
          : QuickBookingSmsStatus.FAILED,
      },
      false,
    );
  }

  async list(query: ListQuickBookingsDto) {
    const where: Prisma.QuickBookingRequestWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              {
                requestNumber: {
                  contains: query.search.trim(),
                  mode: 'insensitive',
                },
              },
              { phone: { contains: query.search.replace(/\s/g, '') } },
              {
                vehicle: {
                  is: {
                    OR: [
                      {
                        brand: {
                          contains: query.search.trim(),
                          mode: 'insensitive',
                        },
                      },
                      {
                        model: {
                          contains: query.search.trim(),
                          mode: 'insensitive',
                        },
                      },
                      {
                        plateNumber: {
                          contains: query.search.trim(),
                          mode: 'insensitive',
                        },
                      },
                    ],
                  },
                },
              },
            ],
          }
        : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.quickBookingRequest.findMany({
        where,
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
          handledBy: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.quickBookingRequest.count({ where }),
    ]);
    return { items, total, page: query.page, limit: query.limit };
  }

  async update(id: string, actorId: string, dto: UpdateQuickBookingDto) {
    if (dto.status === undefined && dto.adminNotes === undefined) {
      throw new BadRequestException('Không có dữ liệu cần cập nhật');
    }
    const current = await this.prisma.quickBookingRequest.findUnique({
      where: { id },
    });
    if (!current) throw new NotFoundException('Không tìm thấy yêu cầu');

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.quickBookingRequest.update({
        where: { id },
        data: {
          ...(dto.status ? { status: dto.status } : {}),
          ...(dto.adminNotes !== undefined
            ? { adminNotes: dto.adminNotes.trim() || null }
            : {}),
          handledById: actorId,
          ...(dto.status === QuickBookingStatus.CONTACTED ||
          dto.status === QuickBookingStatus.CLOSED
            ? { contactedAt: current.contactedAt || new Date() }
            : {}),
        },
        include: {
          vehicle: true,
          handledBy: { select: { id: true, name: true } },
        },
      });
      await tx.auditLog.create({
        data: {
          userId: actorId,
          action: 'UPDATE_QUICK_BOOKING',
          targetTable: 'QuickBookingRequest',
          targetId: id,
          oldValue: {
            status: current.status,
            adminNotes: current.adminNotes,
            handledById: current.handledById,
          },
          newValue: {
            status: updated.status,
            adminNotes: updated.adminNotes,
            handledById: updated.handledById,
          },
        },
      });
      return updated;
    });
  }

  async resendSms(id: string) {
    const request = await this.prisma.quickBookingRequest.findUnique({
      where: { id },
      include: { vehicle: true },
    });
    if (!request) throw new NotFoundException('Không tìm thấy yêu cầu');
    const smsSent = await this.deliverSms(request);
    return {
      smsSent,
      smsStatus: smsSent
        ? QuickBookingSmsStatus.SENT
        : QuickBookingSmsStatus.FAILED,
      message: smsSent
        ? 'Đã gửi SMS xác nhận.'
        : 'Yêu cầu vẫn được lưu nhưng SMS chưa gửi được. Vui lòng kiểm tra cấu hình SMS.',
    };
  }

  private validateDates(startValue: string, endValue: string) {
    const startDate = new Date(startValue);
    const endDate = new Date(endValue);
    if (
      Number.isNaN(startDate.getTime()) ||
      Number.isNaN(endDate.getTime()) ||
      startDate >= endDate
    ) {
      throw new BadRequestException('Ngày nhận/trả xe không hợp lệ');
    }
    const now = new Date();
    if (startDate.getTime() < now.getTime() - 5 * 60_000) {
      throw new BadRequestException('Ngày nhận xe phải ở tương lai');
    }
    const rentalDays = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / 86_400_000,
    );
    if (rentalDays > MAX_RENTAL_DAYS) {
      throw new BadRequestException(
        `Đặt xe nhanh hỗ trợ tối đa ${MAX_RENTAL_DAYS} ngày`,
      );
    }
    if (startDate.getTime() - now.getTime() > MAX_ADVANCE_DAYS * 86_400_000) {
      throw new BadRequestException(
        `Chỉ có thể đặt trước tối đa ${MAX_ADVANCE_DAYS} ngày`,
      );
    }
    return { startDate, endDate };
  }

  private async getAvailableVehicle(
    vehicleId: string,
    startDate: Date,
    endDate: Date,
  ) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });
    if (!vehicle || vehicle.status !== VehicleStatus.AVAILABLE) {
      throw new NotFoundException('Xe không tồn tại hoặc đang không khả dụng');
    }
    const conflict = await this.prisma.booking.count({
      where: {
        vehicleId,
        status: { in: ACTIVE_BOOKING_STATUSES },
        startDate: { lt: endDate },
        endDate: { gt: startDate },
      },
    });
    if (conflict > 0) {
      throw new BadRequestException(
        'Xe vừa được chọn trong khoảng thời gian này. Vui lòng chọn xe khác.',
      );
    }
    return vehicle;
  }

  private async deliverSms(request: {
    id: string;
    requestNumber: string;
    phone: string;
    startDate: Date;
    endDate: Date;
    vehicle: { brand: string; model: string };
  }) {
    let smsSent = false;
    try {
      smsSent = await this.notifications.sendSMS(
        request.phone,
        `datxe: Da nhan yeu cau ${request.requestNumber} cho ${request.vehicle.brand} ${request.vehicle.model}, ${this.formatDate(request.startDate)} - ${this.formatDate(request.endDate)}. Xe chi duoc giu sau khi nhan vien xac nhan.`,
        'quick-booking-customer',
        undefined,
        `quick-booking:${request.id}`,
      );
    } catch {
      smsSent = false;
    }
    await this.prisma.quickBookingRequest.update({
      where: { id: request.id },
      data: {
        smsStatus: smsSent
          ? QuickBookingSmsStatus.SENT
          : QuickBookingSmsStatus.FAILED,
        smsLastAttemptAt: new Date(),
        ...(smsSent ? { smsSentAt: new Date() } : {}),
      },
    });
    return smsSent;
  }

  private toPublicResponse(
    request: {
      id: string;
      requestNumber: string;
      phone: string;
      startDate: Date;
      endDate: Date;
      smsStatus: QuickBookingSmsStatus;
      vehicle: { id: string; brand: string; model: string };
    },
    duplicate: boolean,
  ) {
    const smsSent = request.smsStatus === QuickBookingSmsStatus.SENT;
    return {
      id: request.id,
      requestNumber: request.requestNumber,
      maskedPhone: maskPhone(request.phone),
      startDate: request.startDate,
      endDate: request.endDate,
      vehicle: request.vehicle,
      smsSent,
      duplicate,
      reservationConfirmed: false,
      message: smsSent
        ? 'Đã lưu yêu cầu và gửi SMS xác nhận tiếp nhận. Nhân viên sẽ sớm liên hệ.'
        : 'Đã lưu yêu cầu. SMS chưa gửi được, nhân viên vẫn sẽ liên hệ với bạn.',
    };
  }

  private createRequestNumber() {
    const date = new Date().toISOString().slice(0, 10).replaceAll('-', '');
    return `QB-${date}-${randomUUID().slice(0, 6).toUpperCase()}`;
  }

  private formatDate(value: Date) {
    return new Intl.DateTimeFormat('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(value);
  }

  private escapeHtml(value: string) {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  private adminEmailBody(request: {
    requestNumber: string;
    phone: string;
    startDate: Date;
    endDate: Date;
    vehicle: { brand: string; model: string; plateNumber: string };
  }) {
    return [
      '<h2>Yêu cầu đặt xe nhanh mới</h2>',
      `<p>Mã: <strong>${this.escapeHtml(request.requestNumber)}</strong></p>`,
      `<p>SĐT: ${this.escapeHtml(request.phone)}</p>`,
      `<p>Xe: ${this.escapeHtml(`${request.vehicle.brand} ${request.vehicle.model}`)} (${this.escapeHtml(request.vehicle.plateNumber)})</p>`,
      `<p>Ngày nhận/trả: ${this.formatDate(request.startDate)} - ${this.formatDate(request.endDate)}</p>`,
      '<p>Vui lòng mở trang quản trị để xử lý và liên hệ khách hàng.</p>',
    ].join('');
  }
}
