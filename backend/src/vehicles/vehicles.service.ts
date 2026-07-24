import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleDto, UpdateVehicleDto } from './dto/vehicle.dto';
import { Prisma, Role, Vehicle, VehicleStatus } from '@prisma/client';
import { AuthenticatedUser } from '../auth/types/authenticated-user';
import { RENTAL_LOCATION } from '../common/rental-location';

@Injectable()
export class VehiclesService {
  constructor(private prisma: PrismaService) {}

  // Danh sách các ngày lễ cố định ở Việt Nam (định dạng MM-DD)
  private readonly VIETNAM_HOLIDAYS = [
    '01-01', // Tết Dương Lịch
    '04-30', // Giải Phóng Miền Nam
    '05-01', // Quốc Tế Lao Động
    '09-02', // Quốc Khánh
  ];

  // Kiểm tra ngày có phải là ngày lễ Việt Nam
  isHoliday(date: Date): boolean {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const checkStr = `${month}-${day}`;
    return this.VIETNAM_HOLIDAYS.includes(checkStr);
  }

  // Thuật toán Dynamic Pricing: Tính giá linh hoạt theo lịch ngày lễ, cuối tuần, ngày thường
  calculateTotalPrice(
    vehicle: Vehicle,
    start: Date,
    end: Date,
  ): { totalPrice: number; totalDays: number; details: any[] } {
    if (start >= end) {
      throw new BadRequestException('End date must be greater than start date');
    }

    let totalPrice = 0;
    const details = [];
    const current = new Date(start);
    let totalDays = 0;

    // Lặp qua từng ngày thuê
    while (current < end) {
      const dayOfWeek = current.getDay(); // 0: Chủ Nhật, 6: Thứ Bảy
      let price = vehicle.dailyPrice;
      let type = 'Ngày thường';

      if (this.isHoliday(current)) {
        price = vehicle.holidayPrice;
        type = 'Ngày lễ';
      } else if (dayOfWeek === 0 || dayOfWeek === 6) {
        price = vehicle.weekendPrice;
        type = 'Cuối tuần';
      }

      totalPrice += price;
      details.push({
        date: new Date(current).toISOString().split('T')[0],
        price,
        type,
      });

      totalDays++;
      current.setDate(current.getDate() + 1);
    }

    return { totalPrice, totalDays, details };
  }

  async create(dto: CreateVehicleDto, ownerId?: string): Promise<Vehicle> {
    return await this.prisma.vehicle.create({
      data: {
        ...dto,
        images: dto.images || [],
        status: VehicleStatus.AVAILABLE,
        ownerId: ownerId || null,
        pickupLocation: RENTAL_LOCATION.address,
        latitude: RENTAL_LOCATION.latitude,
        longitude: RENTAL_LOCATION.longitude,
      },
    });
  }

  async findByOwner(ownerId: string): Promise<Vehicle[]> {
    return await this.prisma.vehicle.findMany({
      where: { ownerId },
    });
  }

  async findAll(filters: {
    brand?: string;
    seats?: number;
  }): Promise<Vehicle[]> {
    return await this.prisma.vehicle.findMany({
      where: {
        ...(filters.brand
          ? { brand: { contains: filters.brand, mode: 'insensitive' } }
          : {}),
        ...(filters.seats ? { seats: filters.seats } : {}),
      },
    });
  }

  async findAvailableNow(filters: {
    brand?: string;
    seats?: number;
  }): Promise<Vehicle[]> {
    const now = new Date();
    const busyBookings = await this.prisma.booking.findMany({
      where: {
        status: { in: ['CONFIRMED', 'RENTING', 'PENDING'] },
        startDate: { lte: now },
        endDate: { gt: now },
      },
      select: { vehicleId: true },
    });

    return await this.prisma.vehicle.findMany({
      where: {
        status: {
          notIn: [VehicleStatus.LOCKED, VehicleStatus.MAINTENANCE],
        },
        id: { notIn: busyBookings.map((booking) => booking.vehicleId) },
        images: { isEmpty: false },
        ...(filters.brand
          ? { brand: { contains: filters.brand, mode: 'insensitive' } }
          : {}),
        ...(filters.seats ? { seats: filters.seats } : {}),
      },
      orderBy: [{ updatedAt: 'desc' }],
    });
  }

  // Tìm các xe trống không bị trùng lịch
  async findAvailable(
    startDateStr: string,
    endDateStr: string,
    filters: { brand?: string; seats?: number },
  ): Promise<Vehicle[]> {
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new BadRequestException('Invalid start or end date');
    }

    if (startDate >= endDate) {
      throw new BadRequestException('Start date must be before end date');
    }

    // 1. Tìm IDs của tất cả các xe đã bị đặt trong khoảng thời gian này
    const bookedVehicles = await this.prisma.booking.findMany({
      where: {
        status: { in: ['CONFIRMED', 'RENTING', 'PENDING'] },
        NOT: {
          OR: [
            { endDate: { lte: startDate } }, // Cũ trả trước khi mới nhận
            { startDate: { gte: endDate } }, // Cũ nhận sau khi mới trả
          ],
        },
      },
      select: { vehicleId: true },
    });

    const bookedIds = bookedVehicles.map((b) => b.vehicleId);

    // 2. Lấy ra các xe trống và đáp ứng bộ lọc
    return await this.prisma.vehicle.findMany({
      where: {
        status: {
          notIn: [VehicleStatus.LOCKED, VehicleStatus.MAINTENANCE],
        },
        id: { notIn: bookedIds },
        images: { isEmpty: false },
        ...(filters.brand
          ? { brand: { contains: filters.brand, mode: 'insensitive' } }
          : {}),
        ...(filters.seats ? { seats: filters.seats } : {}),
      },
      orderBy: [{ updatedAt: 'desc' }],
    });
  }

  async findOne(id: string): Promise<Vehicle> {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id } });
    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${id} not found`);
    }
    return vehicle;
  }

  async getCalendar(id: string, fromValue?: string, toValue?: string) {
    const vehicle = await this.findOne(id);
    const from = fromValue ? new Date(fromValue) : new Date();
    const to = toValue
      ? new Date(toValue)
      : new Date(from.getTime() + 180 * 86_400_000);
    if (
      Number.isNaN(from.getTime()) ||
      Number.isNaN(to.getTime()) ||
      from >= to
    ) {
      throw new BadRequestException('Khoảng thời gian xem lịch không hợp lệ');
    }
    if (to.getTime() - from.getTime() > 366 * 86_400_000) {
      throw new BadRequestException('Chỉ có thể xem lịch tối đa 366 ngày');
    }

    const bookings = await this.prisma.booking.findMany({
      where: {
        vehicleId: id,
        status: { in: ['CONFIRMED', 'RENTING', 'PENDING'] },
        startDate: { lt: to },
        endDate: { gt: from },
      },
      select: {
        startDate: true,
        endDate: true,
      },
      orderBy: { startDate: 'asc' },
    });

    const maintenances = await this.prisma.maintenance.findMany({
      where: {
        vehicleId: id,
        completedDate: null,
        scheduledDate: { gte: from, lt: to },
      },
      select: {
        scheduledDate: true,
      },
      orderBy: { scheduledDate: 'asc' },
    });

    return {
      vehicle: {
        id: vehicle.id,
        brand: vehicle.brand,
        model: vehicle.model,
        status: vehicle.status,
      },
      range: { from, to },
      busyPeriods: [
        ...bookings.map((booking) => ({
          type: 'BOOKING' as const,
          label: 'Đã có lịch thuê',
          startDate: booking.startDate,
          endDate: booking.endDate,
        })),
        ...maintenances.map((maintenance) => ({
          type: 'MAINTENANCE' as const,
          label: 'Lịch bảo dưỡng',
          startDate: maintenance.scheduledDate,
          endDate: new Date(maintenance.scheduledDate.getTime() + 86_400_000),
        })),
      ].sort(
        (left, right) => left.startDate.getTime() - right.startDate.getTime(),
      ),
    };
  }

  private assertCanManage(vehicle: Vehicle, actor: AuthenticatedUser) {
    if (actor.role === Role.OWNER && vehicle.ownerId !== actor.id) {
      throw new BadRequestException('Bạn không sở hữu phương tiện này');
    }
  }

  async update(
    id: string,
    dto: UpdateVehicleDto,
    actor: AuthenticatedUser,
  ): Promise<Vehicle> {
    const current = await this.findOne(id);
    this.assertCanManage(current, actor);

    const operationalFields: Array<keyof UpdateVehicleDto> = [
      'plateNumber',
      'brand',
      'model',
      'year',
      'seats',
      'transmission',
      'fuel',
      'dailyPrice',
      'weekendPrice',
      'holidayPrice',
      'penaltyRate',
      'limitKmPerDay',
      'overLimitFee',
    ];
    if (
      current.status === VehicleStatus.RENTED &&
      operationalFields.some((field) => dto[field] !== undefined)
    ) {
      throw new BadRequestException(
        'Không thể đổi thông tin vận hành hoặc giá khi xe đang được thuê',
      );
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const updated = await tx.vehicle.update({
          where: { id },
          data: dto,
        });
        await tx.auditLog.create({
          data: {
            userId: actor.id,
            action: 'UPDATE_VEHICLE',
            targetTable: 'Vehicle',
            targetId: id,
            oldValue: current,
            newValue: { ...dto },
          },
        });
        return updated;
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException('Biển số xe đã tồn tại');
      }
      throw error;
    }
  }

  async updateStatus(
    id: string,
    status: VehicleStatus,
    actor: AuthenticatedUser,
  ): Promise<Vehicle> {
    const current = await this.findOne(id);
    this.assertCanManage(current, actor);
    if (
      current.status === VehicleStatus.RENTED &&
      status !== VehicleStatus.RENTED
    ) {
      throw new BadRequestException(
        'Trạng thái xe đang thuê được cập nhật theo vòng đời đơn thuê',
      );
    }
    return await this.prisma.$transaction(async (tx) => {
      const updated = await tx.vehicle.update({
        where: { id },
        data: { status },
      });
      await tx.auditLog.create({
        data: {
          userId: actor.id,
          action: 'UPDATE_VEHICLE_STATUS',
          targetTable: 'Vehicle',
          targetId: id,
          oldValue: { status: current.status },
          newValue: { status },
        },
      });
      return updated;
    });
  }

  async delete(id: string, actor: AuthenticatedUser): Promise<void> {
    const current = await this.findOne(id);
    this.assertCanManage(current, actor);
    if (current.status === VehicleStatus.RENTED) {
      throw new BadRequestException('Không thể xóa xe đang được thuê');
    }
    await this.prisma.vehicle.delete({ where: { id } });
  }

  // Gợi ý xe tương tự khi xe A hết lịch
  async findSuggestions(
    brand: string,
    seats: number,
    startDateStr: string,
    endDateStr: string,
  ): Promise<Vehicle[]> {
    const available = await this.findAvailable(startDateStr, endDateStr, {});
    // Lọc các xe có cùng số ghế hoặc hãng xe
    return available
      .filter(
        (v) =>
          v.seats === seats || v.brand.toLowerCase() === brand.toLowerCase(),
      )
      .slice(0, 3);
  }
}
