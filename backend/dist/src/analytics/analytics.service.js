"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let AnalyticsService = class AnalyticsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getDashboardStats() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const vehicles = await this.prisma.vehicle.findMany({
            select: { status: true },
        });
        const stats = {
            total: vehicles.length,
            available: vehicles.filter((v) => v.status === 'AVAILABLE').length,
            rented: vehicles.filter((v) => v.status === 'RENTED').length,
            maintenance: vehicles.filter((v) => v.status === 'MAINTENANCE').length,
        };
        const bookingsTodayCount = await this.prisma.booking.count({
            where: {
                createdAt: { gte: today },
            },
        });
        const revenuesToday = await this.prisma.revenue.aggregate({
            where: {
                date: { gte: today },
            },
            _sum: {
                amount: true,
            },
        });
        const revenuesMonth = await this.prisma.revenue.aggregate({
            where: {
                date: { gte: startOfMonth },
            },
            _sum: {
                amount: true,
            },
        });
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
        const totalDaysRented = activeBookings.reduce((sum, b) => sum + b.totalDays, 0);
        const totalPossibleDays = stats.total * 30;
        const occupancyRate = totalPossibleDays > 0 ? (totalDaysRented / totalPossibleDays) * 100 : 0;
        return {
            vehicleStats: stats,
            bookingsToday: bookingsTodayCount,
            revenueToday: revenuesToday._sum.amount || 0,
            revenueMonth: revenuesMonth._sum.amount || 0,
            occupancyRate: Math.round(occupancyRate * 100) / 100,
        };
    }
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
            const maintenanceCost = v.maintenances.reduce((sum, m) => sum + m.cost, 0);
            const otherExpense = v.expenses.reduce((sum, e) => sum + e.amount, 0);
            const totalCost = maintenanceCost + otherExpense;
            const netProfit = totalRevenue - totalCost;
            const totalRentedDays = v.revenues.length * 3;
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
        const topRevenue = [...mapped].sort((a, b) => b.revenue - a.revenue).slice(0, 5);
        const topFrequency = [...mapped].sort((a, b) => b.frequency - a.frequency).slice(0, 5);
        return {
            topRevenue,
            topFrequency,
        };
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map