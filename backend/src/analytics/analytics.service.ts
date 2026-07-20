import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // 1. Số lượng xe theo trạng thái
    const vehicles = await this.prisma.vehicle.findMany({
      select: { status: true },
    });

    const stats = {
      total: vehicles.length,
      available: vehicles.filter((v) => v.status === 'AVAILABLE').length,
      rented: vehicles.filter((v) => v.status === 'RENTED').length,
      maintenance: vehicles.filter((v) => v.status === 'MAINTENANCE').length,
    };

    // 2. Booking trong ngày hôm nay
    const bookingsTodayCount = await this.prisma.booking.count({
      where: {
        createdAt: { gte: today },
      },
    });

    // 3. Doanh thu hôm nay
    const revenuesToday = await this.prisma.revenue.aggregate({
      where: {
        date: { gte: today },
      },
      _sum: {
        amount: true,
      },
    });

    // 4. Doanh thu tháng này
    const revenuesMonth = await this.prisma.revenue.aggregate({
      where: {
        date: { gte: startOfMonth },
      },
      _sum: {
        amount: true,
      },
    });

    // 5. Tỷ lệ lấp đầy (Occupancy Rate) trung bình của đội xe trong 30 ngày qua
    // Công thức: Tổng số ngày đã thuê của các xe / (Tổng số xe * 30 ngày)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activeBookings = await this.prisma.booking.findMany({
      where: {
        status: 'COMPLETED',
        startDate: { gte: thirtyDaysAgo },
      },
      select: {
        totalDays: true,
      },
    });

    const totalDaysRented = activeBookings.reduce(
      (sum, b) => sum + b.totalDays,
      0,
    );
    const totalPossibleDays = stats.total * 30;
    const occupancyRate =
      totalPossibleDays > 0 ? (totalDaysRented / totalPossibleDays) * 100 : 0;

    return {
      vehicleStats: stats,
      bookingsToday: bookingsTodayCount,
      revenueToday: revenuesToday._sum.amount || 0,
      revenueMonth: revenuesMonth._sum.amount || 0,
      occupancyRate: Math.round(occupancyRate * 100) / 100, // Làm tròn 2 chữ số
    };
  }

  // Báo cáo tài chính chi tiết cho từng xe
  async getFinancialReport() {
    const vehicles = await this.prisma.vehicle.findMany({
      include: {
        revenues: true,
        expenses: true,
        maintenances: true,
      },
    });

    return vehicles.map((v) => {
      const totalRevenue = v.revenues.reduce((sum, r) => sum + r.amount, 0);

      // Chi phí bảo dưỡng
      const maintenanceCost = v.maintenances.reduce(
        (sum, m) => sum + m.cost,
        0,
      );

      // Chi phí vận hành khác (Khấu hao, đăng kiểm, bảo hiểm...)
      const otherExpense = v.expenses.reduce((sum, e) => sum + e.amount, 0);

      const totalCost = maintenanceCost + otherExpense;
      const netProfit = totalRevenue - totalCost;

      // Tính occupancy rate riêng cho xe này (số ngày hoạt động / 30 ngày)
      const totalRentedDays = v.revenues.length * 3; // Giả lập trung bình 3 ngày mỗi booking
      const occupancyRate = (totalRentedDays / 30) * 100;

      return {
        vehicleId: v.id,
        plateNumber: v.plateNumber,
        brand: v.brand,
        model: v.model,
        revenue: totalRevenue,
        maintenanceCost,
        otherExpense,
        totalCost,
        netProfit,
        occupancyRate: Math.min(100, Math.round(occupancyRate * 100) / 100),
      };
    });
  }

  // Top xe hiệu suất cao
  async getTopVehicles() {
    const vehicles = await this.prisma.vehicle.findMany({
      include: {
        bookings: {
          where: { status: 'COMPLETED' },
        },
        revenues: true,
      },
    });

    const mapped = vehicles.map((v) => {
      const totalRevenue = v.revenues.reduce((sum, r) => sum + r.amount, 0);
      const frequency = v.bookings.length;
      return {
        id: v.id,
        plateNumber: v.plateNumber,
        brand: v.brand,
        model: v.model,
        revenue: totalRevenue,
        frequency,
      };
    });

    // Sắp xếp theo doanh thu cao nhất
    const topRevenue = [...mapped]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
    // Sắp xếp theo tần suất thuê nhiều nhất
    const topFrequency = [...mapped]
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5);

    return {
      topRevenue,
      topFrequency,
    };
  }
}
