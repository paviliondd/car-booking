import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleDto } from './dto/vehicle.dto';
import { Vehicle, VehicleStatus } from '@prisma/client';

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
  calculateTotalPrice(vehicle: Vehicle, start: Date, end: Date): { totalPrice: number; totalDays: number; details: any[] } {
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

  async create(dto: CreateVehicleDto): Promise<Vehicle> {
    return await this.prisma.vehicle.create({
      data: {
        ...dto,
        images: dto.images || [],
        status: VehicleStatus.AVAILABLE,
      },
    });
  }

  async findAll(filters: { brand?: string; seats?: number }): Promise<Vehicle[]> {
    return await this.prisma.vehicle.findMany({
      where: {
        ...(filters.brand ? { brand: { contains: filters.brand, mode: 'insensitive' } } : {}),
        ...(filters.seats ? { seats: filters.seats } : {}),
      },
    });
  }

  // Tìm các xe trống không bị trùng lịch
  async findAvailable(startDateStr: string, endDateStr: string, filters: { brand?: string; seats?: number }): Promise<Vehicle[]> {
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
            { endDate: { lte: startDate } },   // Cũ trả trước khi mới nhận
            { startDate: { gte: endDate } },   // Cũ nhận sau khi mới trả
          ],
        },
      },
      select: { vehicleId: true },
    });

    const bookedIds = bookedVehicles.map((b) => b.vehicleId);

    // 2. Lấy ra các xe trống và đáp ứng bộ lọc
    return await this.prisma.vehicle.findMany({
      where: {
        status: VehicleStatus.AVAILABLE, // Chỉ lấy các xe đang hoạt động tốt (không bảo dưỡng, khóa)
        id: { notIn: bookedIds },
        ...(filters.brand ? { brand: { contains: filters.brand, mode: 'insensitive' } } : {}),
        ...(filters.seats ? { seats: filters.seats } : {}),
      },
    });
  }

  async findOne(id: string): Promise<Vehicle> {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id } });
    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${id} not found`);
    }
    return vehicle;
  }

  async getCalendar(id: string) {
    const vehicle = await this.findOne(id);
    const bookings = await this.prisma.booking.findMany({
      where: {
        vehicleId: id,
        status: { in: ['CONFIRMED', 'RENTING', 'PENDING'] },
      },
      select: {
        id: true,
        startDate: true,
        endDate: true,
        status: true,
      },
    });

    const maintenances = await this.prisma.maintenance.findMany({
      where: {
        vehicleId: id,
        completedDate: null,
      },
      select: {
        id: true,
        scheduledDate: true,
        type: true,
      },
    });

    return {
      vehicle,
      bookings,
      maintenances,
    };
  }

  async update(id: string, dto: Partial<CreateVehicleDto>): Promise<Vehicle> {
    await this.findOne(id);
    return await this.prisma.vehicle.update({
      where: { id },
      data: dto,
    });
  }

  async updateStatus(id: string, status: VehicleStatus): Promise<Vehicle> {
    await this.findOne(id);
    return await this.prisma.vehicle.update({
      where: { id },
      data: { status },
    });
  }

  async delete(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.vehicle.delete({ where: { id } });
  }

  // Gợi ý xe tương tự khi xe A hết lịch
  async findSuggestions(brand: string, seats: number, startDateStr: string, endDateStr: string): Promise<Vehicle[]> {
    const available = await this.findAvailable(startDateStr, endDateStr, {});
    // Lọc các xe có cùng số ghế hoặc hãng xe
    return available.filter((v) => v.seats === seats || v.brand.toLowerCase() === brand.toLowerCase()).slice(0, 3);
  }
}
