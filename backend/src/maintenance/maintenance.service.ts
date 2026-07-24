import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Maintenance, VehicleStatus } from '@prisma/client';

@Injectable()
export class MaintenanceService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    vehicleId: string;
    type: string;
    scheduledDate: string;
    description?: string;
    cost?: number;
  }): Promise<Maintenance> {
    const scheduled = new Date(data.scheduledDate);
    const activeBooking = await this.prisma.booking.findFirst({
      where: {
        vehicleId: data.vehicleId,
        status: { in: ['PENDING', 'CONFIRMED', 'RENTING'] },
        startDate: { lte: scheduled },
        endDate: { gte: scheduled },
      },
    });

    if (activeBooking) {
      throw new BadRequestException(
        `Xe đang có đơn thuê ${activeBooking.bookingNumber} trùng ngày bảo dưỡng`,
      );
    }

    // Tự động tạm khóa xe chuyển sang bảo dưỡng
    await this.prisma.vehicle.update({
      where: { id: data.vehicleId },
      data: { status: VehicleStatus.MAINTENANCE },
    });

    return await this.prisma.maintenance.create({
      data: {
        vehicleId: data.vehicleId,
        type: data.type,
        scheduledDate: new Date(data.scheduledDate),
        description: data.description,
        cost: data.cost || 0,
      },
    });
  }

  async complete(id: string, cost: number): Promise<Maintenance> {
    const maintenance = await this.prisma.maintenance.findUnique({
      where: { id },
    });
    if (!maintenance) {
      throw new NotFoundException('Không tìm thấy lịch bảo dưỡng');
    }

    const updated = await this.prisma.maintenance.update({
      where: { id },
      data: {
        completedDate: new Date(),
        cost,
      },
    });

    // Mở lại trạng thái xe thành Sẵn sàng
    await this.prisma.vehicle.update({
      where: { id: maintenance.vehicleId },
      data: { status: VehicleStatus.AVAILABLE },
    });

    // Đồng thời tạo một chi phí Expense tương ứng trong báo cáo tài chính
    await this.prisma.expense.create({
      data: {
        vehicleId: maintenance.vehicleId,
        category: 'MAINTENANCE',
        amount: cost,
        date: new Date(),
        description: `Bảo dưỡng: ${maintenance.type} (${maintenance.description || ''})`,
      },
    });

    return updated;
  }

  async findAll(): Promise<Maintenance[]> {
    return await this.prisma.maintenance.findMany({
      include: { vehicle: true },
      orderBy: { scheduledDate: 'asc' },
    });
  }

  // Cảnh báo các lịch bảo dưỡng / đăng kiểm sắp đến hạn trong vòng 7 ngày
  async getAlerts() {
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

    // Lấy các lịch bảo dưỡng chưa hoàn thành và hạn chót <= 7 ngày tới
    const upcomingMaintenances = await this.prisma.maintenance.findMany({
      where: {
        completedDate: null,
        scheduledDate: { lte: sevenDaysLater },
      },
      include: { vehicle: true },
    });

    return upcomingMaintenances.map((m) => ({
      id: m.id,
      vehicleId: m.vehicleId,
      plateNumber: m.vehicle.plateNumber,
      brand: m.vehicle.brand,
      model: m.vehicle.model,
      type: m.type,
      scheduledDate: m.scheduledDate,
      description: m.description,
      daysRemaining: Math.ceil(
        (m.scheduledDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      ),
    }));
  }
}
