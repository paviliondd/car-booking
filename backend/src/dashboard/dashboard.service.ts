import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BookingStatus,
  PaymentStatus,
  Role,
  VehicleStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  private isDemoEnabled() {
    return this.configService.get<string>('ENABLE_DEMO_DATA') === 'true';
  }

  private useDemoOrThrow<T>(demo: T, error: unknown): T {
    if (this.isDemoEnabled()) {
      this.logger.warn(
        `Demo dashboard enabled after data error: ${error instanceof Error ? error.message : String(error)}`,
      );
      return demo;
    }
    throw error;
  }

  private ownerId(actor: { id: string; role: Role }) {
    return actor.role === Role.OWNER ? actor.id : undefined;
  }

  private demoOverview(period: string) {
    const scale =
      period === 'last_month' ? 0.82 : period === 'this_month' ? 1.18 : 0.12;
    const totalMoneyContract = Math.round(186000000 * scale);

    return {
      totalContract: Math.max(4, Math.round(42 * scale)),
      totalMoneyContract,
      totalMoneyForward: Math.round(totalMoneyContract * 0.12),
      totalCollect: Math.round(totalMoneyContract * 0.78),
      totalExpense: Math.round(totalMoneyContract * 0.22),
    };
  }

  private demoRevenueChart(month: string) {
    const [yearStr, monthStr] = month.split('-');
    const year = parseInt(yearStr, 10);
    const monthIndex = parseInt(monthStr, 10) - 1;
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

    return Array.from({ length: daysInMonth }, (_, index) => {
      const day = index + 1;
      const wave = Math.sin(day / 3) * 650000;
      return {
        date: `${year}-${monthStr}-${day.toString().padStart(2, '0')}`,
        revenue: Math.max(0, Math.round(3200000 + wave + day * 85000)),
      };
    });
  }

  async getOverview(period: string, actor: { id: string; role: Role }) {
    try {
      const now = new Date();
      let startDate = new Date();
      let endDate = new Date();

      if (period === 'today') {
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
      } else if (period === 'this_month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          0,
          23,
          59,
          59,
          999,
        );
      } else if (period === 'last_month') {
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(
          now.getFullYear(),
          now.getMonth(),
          0,
          23,
          59,
          59,
          999,
        );
      }

      const bookings = await this.prisma.booking.findMany({
        where: {
          vehicle: { ownerId: this.ownerId(actor) },
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          totalPrice: true,
          status: true,
          payment: { select: { amount: true, status: true } },
        },
      });

      const expenses = await this.prisma.expense.aggregate({
        where: {
          vehicle: { ownerId: this.ownerId(actor) },
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        _sum: {
          amount: true,
        },
      });

      const totalContract = bookings.length;
      const totalMoneyContract = bookings.reduce(
        (sum, booking) => sum + booking.totalPrice,
        0,
      );
      const recognizedPaymentStatuses: PaymentStatus[] = [
        PaymentStatus.DEPOSITED,
        PaymentStatus.PAID,
      ];
      const totalMoneyForward = bookings
        .filter(
          (booking) =>
            booking.payment &&
            recognizedPaymentStatuses.includes(booking.payment.status),
        )
        .reduce((sum, booking) => sum + (booking.payment?.amount || 0), 0);
      const collectibleStatuses: BookingStatus[] = [
        BookingStatus.CONFIRMED,
        BookingStatus.RENTING,
        BookingStatus.COMPLETED,
      ];
      const totalCollect = bookings
        .filter((booking) => collectibleStatuses.includes(booking.status))
        .reduce((sum, booking) => sum + booking.totalPrice, 0);
      const totalExpense = expenses._sum.amount || 0;

      return {
        totalContract,
        totalMoneyContract,
        totalMoneyForward,
        totalCollect,
        totalExpense,
      };
    } catch (error) {
      return this.useDemoOrThrow(this.demoOverview(period), error);
    }
  }

  async getCarStatusSummary(actor: { id: string; role: Role }) {
    try {
      const ownerId = this.ownerId(actor);
      const bookingOwnerFilter = { vehicle: { ownerId } };
      const vehicleOwnerFilter = { ownerId };
      const [waitConfirm, confirmed, received, returned, accident, pledged] =
        await Promise.all([
          this.prisma.booking.count({
            where: { ...bookingOwnerFilter, status: BookingStatus.PENDING },
          }),
          this.prisma.booking.count({
            where: { ...bookingOwnerFilter, status: BookingStatus.CONFIRMED },
          }),
          this.prisma.booking.count({
            where: { ...bookingOwnerFilter, status: BookingStatus.RENTING },
          }),
          this.prisma.booking.count({
            where: { ...bookingOwnerFilter, status: BookingStatus.COMPLETED },
          }),
          this.prisma.vehicle.count({
            where: { ...vehicleOwnerFilter, status: VehicleStatus.MAINTENANCE },
          }),
          this.prisma.vehicle.count({
            where: { ...vehicleOwnerFilter, status: VehicleStatus.LOCKED },
          }),
        ]);

      return { waitConfirm, confirmed, received, returned, accident, pledged };
    } catch (error) {
      return this.useDemoOrThrow(
        {
          waitConfirm: 8,
          confirmed: 15,
          received: 6,
          returned: 22,
          accident: 1,
          pledged: 3,
        },
        error,
      );
    }
  }

  async getRevenueChart(month: string, actor: { id: string; role: Role }) {
    try {
      const [yearStr, monthStr] = month.split('-');
      const year = parseInt(yearStr, 10);
      const monthIndex = parseInt(monthStr, 10) - 1;
      const startDate = new Date(year, monthIndex, 1);
      const endDate = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);

      const revenues = await this.prisma.revenue.findMany({
        where: {
          vehicle: { ownerId: this.ownerId(actor) },
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          date: true,
          amount: true,
        },
      });

      const daysInMonth = endDate.getDate();
      return Array.from({ length: daysInMonth }, (_, index) => {
        const day = index + 1;
        const dayRevenues = revenues.filter((revenue) => {
          const date = new Date(revenue.date);
          return (
            date.getDate() === day &&
            date.getMonth() === monthIndex &&
            date.getFullYear() === year
          );
        });

        return {
          date: `${year}-${monthStr}-${day.toString().padStart(2, '0')}`,
          revenue: dayRevenues.reduce(
            (sum, revenue) => sum + revenue.amount,
            0,
          ),
        };
      });
    } catch (error) {
      return this.useDemoOrThrow(this.demoRevenueChart(month), error);
    }
  }

  async getTopServices(actor: { id: string; role: Role }) {
    try {
      const vehicles = await this.prisma.vehicle.findMany({
        where: { ownerId: this.ownerId(actor) },
        select: {
          fuel: true,
        },
      });

      const counts: Record<string, number> = {};
      vehicles.forEach((vehicle) => {
        const key =
          vehicle.fuel === 'ELECTRIC'
            ? 'Xe điện'
            : vehicle.fuel === 'DIESEL'
              ? 'Xe dầu'
              : 'Xe xăng';
        counts[key] = (counts[key] || 0) + 1;
      });

      return Object.entries(counts).map(([name, value]) => ({ name, value }));
    } catch (error) {
      return this.useDemoOrThrow(
        [
          { name: 'Xe xăng', value: 42 },
          { name: 'Xe điện', value: 18 },
          { name: 'Xe dầu', value: 12 },
        ],
        error,
      );
    }
  }

  async getTopCars(limit: number, actor: { id: string; role: Role }) {
    try {
      const vehicles = await this.prisma.vehicle.findMany({
        where: { ownerId: this.ownerId(actor) },
        include: {
          bookings: {
            where: { status: BookingStatus.COMPLETED },
          },
          revenues: true,
        },
      });

      const sorted = vehicles
        .map((vehicle) => ({
          name: `${vehicle.brand} ${vehicle.model} (${vehicle.plateNumber})`,
          bookingsCount: vehicle.bookings.length,
          revenue: vehicle.revenues.reduce(
            (sum, revenue) => sum + revenue.amount,
            0,
          ),
        }))
        .sort((a, b) => b.revenue - a.revenue);
      const maxRevenue = sorted[0]?.revenue || 1;

      return sorted.map((car) => ({ ...car, maxRevenue }));
    } catch (error) {
      const cars = [
        {
          name: 'VinFast VF8 (30A-999.99)',
          bookingsCount: 18,
          revenue: 72000000,
        },
        {
          name: 'Kia Carnival (30A-111.11)',
          bookingsCount: 12,
          revenue: 64800000,
        },
        {
          name: 'Toyota Vios (30A-888.88)',
          bookingsCount: 24,
          revenue: 45600000,
        },
        {
          name: 'Mazda CX-5 (30A-777.77)',
          bookingsCount: 15,
          revenue: 39000000,
        },
      ].slice(0, limit);
      const maxRevenue = cars[0]?.revenue || 1;
      return this.useDemoOrThrow(
        cars.map((car) => ({ ...car, maxRevenue })),
        error,
      );
    }
  }

  async getNotifications(limit: number, actor: { id: string; role: Role }) {
    const logs = await this.prisma.auditLog.findMany({
      where: actor.role === Role.OWNER ? { userId: actor.id } : undefined,
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: Math.min(Math.max(limit, 1), 20),
    });
    return logs.map((log) => ({
      id: log.id,
      title: log.action.replaceAll('_', ' '),
      desc: `${log.user?.name || 'Hệ thống'} · ${log.targetTable} ${log.targetId}`,
      date: log.createdAt.toISOString(),
    }));
  }

  async getCarNotifyList() {
    try {
      const vehicles = await this.prisma.vehicle.findMany({ take: 2 });
      return vehicles.map((vehicle) => ({
        id: vehicle.id,
        plateNumber: vehicle.plateNumber,
        brand: vehicle.brand,
        model: vehicle.model,
        type: 'Đến hạn đăng kiểm',
        dueDate: '2026-07-15',
      }));
    } catch {
      return [
        {
          id: 'c1',
          plateNumber: '30A-999.99',
          brand: 'VinFast',
          model: 'VF8',
          type: 'Đến hạn đăng kiểm',
          dueDate: '2026-07-15',
        },
        {
          id: 'c2',
          plateNumber: '30A-888.88',
          brand: 'Toyota',
          model: 'Vios',
          type: 'Đến hạn bảo hiểm',
          dueDate: '2026-07-20',
        },
      ];
    }
  }

  getCarViolateList() {
    return [
      {
        id: 'v1',
        plateNumber: '30A-999.99',
        reason: 'Chạy quá tốc độ (85/60 km/h) tại Cầu Nhật Tân',
        fineAmount: 2500000,
        violatedAt: '2026-06-10',
        status: 'Chưa xử lý',
      },
      {
        id: 'v2',
        plateNumber: '30A-888.88',
        reason: 'Không chấp hành hiệu lệnh đèn tín hiệu giao thông',
        fineAmount: 4000000,
        violatedAt: '2026-06-15',
        status: 'Chưa xử lý',
      },
    ];
  }
}
