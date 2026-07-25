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
var DashboardService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
let DashboardService = DashboardService_1 = class DashboardService {
    prisma;
    configService;
    logger = new common_1.Logger(DashboardService_1.name);
    constructor(prisma, configService) {
        this.prisma = prisma;
        this.configService = configService;
    }
    isDemoEnabled() {
        return this.configService.get('ENABLE_DEMO_DATA') === 'true';
    }
    useDemoOrThrow(demo, error) {
        if (this.isDemoEnabled()) {
            this.logger.warn(`Demo dashboard enabled after data error: ${error instanceof Error ? error.message : String(error)}`);
            return demo;
        }
        throw error;
    }
    ownerId(actor) {
        return actor.role === client_1.Role.OWNER ? actor.id : undefined;
    }
    demoOverview(period) {
        const scale = period === 'last_month' ? 0.82 : period === 'this_month' ? 1.18 : 0.12;
        const totalMoneyContract = Math.round(186000000 * scale);
        return {
            totalContract: Math.max(4, Math.round(42 * scale)),
            totalMoneyContract,
            totalMoneyForward: Math.round(totalMoneyContract * 0.12),
            totalCollect: Math.round(totalMoneyContract * 0.78),
            totalExpense: Math.round(totalMoneyContract * 0.22),
        };
    }
    demoRevenueChart(month) {
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
    async getOverview(period, actor) {
        try {
            const now = new Date();
            let startDate = new Date();
            let endDate = new Date();
            if (period === 'today') {
                startDate.setHours(0, 0, 0, 0);
                endDate.setHours(23, 59, 59, 999);
            }
            else if (period === 'this_month') {
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
            }
            else if (period === 'last_month') {
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
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
            const totalMoneyContract = bookings.reduce((sum, booking) => sum + booking.totalPrice, 0);
            const recognizedPaymentStatuses = [
                client_1.PaymentStatus.DEPOSITED,
                client_1.PaymentStatus.PAID,
            ];
            const totalMoneyForward = bookings
                .filter((booking) => booking.payment &&
                recognizedPaymentStatuses.includes(booking.payment.status))
                .reduce((sum, booking) => sum + (booking.payment?.amount || 0), 0);
            const collectibleStatuses = [
                client_1.BookingStatus.CONFIRMED,
                client_1.BookingStatus.RENTING,
                client_1.BookingStatus.COMPLETED,
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
        }
        catch (error) {
            return this.useDemoOrThrow(this.demoOverview(period), error);
        }
    }
    async getCarStatusSummary(actor) {
        try {
            const ownerId = this.ownerId(actor);
            const bookingOwnerFilter = { vehicle: { ownerId } };
            const vehicleOwnerFilter = { ownerId };
            const [waitConfirm, confirmed, received, returned, accident, pledged] = await Promise.all([
                this.prisma.booking.count({
                    where: { ...bookingOwnerFilter, status: client_1.BookingStatus.PENDING },
                }),
                this.prisma.booking.count({
                    where: { ...bookingOwnerFilter, status: client_1.BookingStatus.CONFIRMED },
                }),
                this.prisma.booking.count({
                    where: { ...bookingOwnerFilter, status: client_1.BookingStatus.RENTING },
                }),
                this.prisma.booking.count({
                    where: { ...bookingOwnerFilter, status: client_1.BookingStatus.COMPLETED },
                }),
                this.prisma.vehicle.count({
                    where: { ...vehicleOwnerFilter, status: client_1.VehicleStatus.MAINTENANCE },
                }),
                this.prisma.vehicle.count({
                    where: { ...vehicleOwnerFilter, status: client_1.VehicleStatus.LOCKED },
                }),
            ]);
            return { waitConfirm, confirmed, received, returned, accident, pledged };
        }
        catch (error) {
            return this.useDemoOrThrow({
                waitConfirm: 8,
                confirmed: 15,
                received: 6,
                returned: 22,
                accident: 1,
                pledged: 3,
            }, error);
        }
    }
    async getRevenueChart(month, actor) {
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
                    return (date.getDate() === day &&
                        date.getMonth() === monthIndex &&
                        date.getFullYear() === year);
                });
                return {
                    date: `${year}-${monthStr}-${day.toString().padStart(2, '0')}`,
                    revenue: dayRevenues.reduce((sum, revenue) => sum + revenue.amount, 0),
                };
            });
        }
        catch (error) {
            return this.useDemoOrThrow(this.demoRevenueChart(month), error);
        }
    }
    async getTopServices(actor) {
        try {
            const vehicles = await this.prisma.vehicle.findMany({
                where: { ownerId: this.ownerId(actor) },
                select: {
                    fuel: true,
                },
            });
            const counts = {};
            vehicles.forEach((vehicle) => {
                const key = vehicle.fuel === 'ELECTRIC'
                    ? 'Xe điện'
                    : vehicle.fuel === 'DIESEL'
                        ? 'Xe dầu'
                        : 'Xe xăng';
                counts[key] = (counts[key] || 0) + 1;
            });
            return Object.entries(counts).map(([name, value]) => ({ name, value }));
        }
        catch (error) {
            return this.useDemoOrThrow([
                { name: 'Xe xăng', value: 42 },
                { name: 'Xe điện', value: 18 },
                { name: 'Xe dầu', value: 12 },
            ], error);
        }
    }
    async getTopCars(limit, actor) {
        try {
            const vehicles = await this.prisma.vehicle.findMany({
                where: { ownerId: this.ownerId(actor) },
                include: {
                    bookings: {
                        where: {
                            status: {
                                in: [
                                    client_1.BookingStatus.CONFIRMED,
                                    client_1.BookingStatus.RENTING,
                                    client_1.BookingStatus.COMPLETED,
                                ],
                            },
                        },
                        select: { totalPrice: true },
                    },
                    revenues: { select: { amount: true } },
                },
            });
            const sorted = vehicles
                .map((vehicle) => {
                const bookingRevenue = vehicle.bookings.reduce((sum, b) => sum + b.totalPrice, 0);
                const tableRevenue = vehicle.revenues.reduce((sum, r) => sum + r.amount, 0);
                const totalRevenue = Math.max(bookingRevenue, tableRevenue);
                return {
                    name: `${vehicle.brand} ${vehicle.model} (${vehicle.plateNumber})`,
                    bookingsCount: vehicle.bookings.length,
                    revenue: totalRevenue,
                };
            })
                .sort((a, b) => b.revenue - a.revenue || b.bookingsCount - a.bookingsCount);
            const topItemRevenue = sorted[0]?.revenue || 0;
            const maxRevenue = topItemRevenue > 0 ? topItemRevenue : 1;
            return sorted.slice(0, limit).map((car) => ({ ...car, maxRevenue }));
        }
        catch (error) {
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
            return this.useDemoOrThrow(cars.map((car) => ({ ...car, maxRevenue })), error);
        }
    }
    async getNotifications(limit, actor) {
        const logs = await this.prisma.auditLog.findMany({
            where: actor.role === client_1.Role.OWNER ? { userId: actor.id } : undefined,
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
        }
        catch {
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
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = DashboardService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map