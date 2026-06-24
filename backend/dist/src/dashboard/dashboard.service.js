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
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let DashboardService = class DashboardService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getOverview(period) {
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
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            select: {
                totalPrice: true,
                status: true,
            },
        });
        const expenses = await this.prisma.expense.aggregate({
            where: {
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
        const totalMoneyContract = bookings.reduce((sum, b) => sum + b.totalPrice, 0);
        const totalMoneyForward = Math.round(totalMoneyContract * 0.12);
        const totalCollect = bookings
            .filter((b) => b.status === client_1.BookingStatus.CONFIRMED || b.status === client_1.BookingStatus.RENTING || b.status === client_1.BookingStatus.COMPLETED)
            .reduce((sum, b) => sum + b.totalPrice, 0);
        const totalExpense = expenses._sum.amount || 0;
        return {
            totalContract,
            totalMoneyContract,
            totalMoneyForward,
            totalCollect,
            totalExpense,
        };
    }
    async getCarStatusSummary() {
        const waitConfirm = await this.prisma.booking.count({
            where: { status: client_1.BookingStatus.PENDING },
        });
        const confirmed = await this.prisma.booking.count({
            where: { status: client_1.BookingStatus.CONFIRMED },
        });
        const received = await this.prisma.booking.count({
            where: { status: client_1.BookingStatus.RENTING },
        });
        const returned = await this.prisma.booking.count({
            where: { status: client_1.BookingStatus.COMPLETED },
        });
        const accident = await this.prisma.vehicle.count({
            where: { status: client_1.VehicleStatus.MAINTENANCE },
        });
        const pledged = await this.prisma.vehicle.count({
            where: { status: client_1.VehicleStatus.LOCKED },
        });
        return {
            waitConfirm,
            confirmed,
            received,
            returned,
            accident,
            pledged,
        };
    }
    async getRevenueChart(month) {
        const [yearStr, monthStr] = month.split('-');
        const year = parseInt(yearStr, 10);
        const mIndex = parseInt(monthStr, 10) - 1;
        const startDate = new Date(year, mIndex, 1);
        const endDate = new Date(year, mIndex + 1, 0, 23, 59, 59, 999);
        const revenues = await this.prisma.revenue.findMany({
            where: {
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
        const chartData = [];
        for (let day = 1; day <= daysInMonth; day++) {
            const dayDateStr = `${year}-${monthStr}-${day.toString().padStart(2, '0')}`;
            const dayRevenues = revenues.filter((r) => {
                const rDate = new Date(r.date);
                return rDate.getDate() === day && rDate.getMonth() === mIndex && rDate.getFullYear() === year;
            });
            const revenueSum = dayRevenues.reduce((sum, r) => sum + r.amount, 0);
            chartData.push({
                date: dayDateStr,
                revenue: revenueSum,
            });
        }
        return chartData;
    }
    async getTopServices() {
        const vehicles = await this.prisma.vehicle.findMany({
            select: {
                fuel: true,
            },
        });
        const counts = {};
        vehicles.forEach((v) => {
            const key = v.fuel === 'ELECTRIC' ? 'Xe Điện' : v.fuel === 'DIESEL' ? 'Xe Dầu' : 'Xe Xăng';
            counts[key] = (counts[key] || 0) + 1;
        });
        return Object.entries(counts).map(([name, value]) => ({
            name,
            value,
        }));
    }
    async getTopCars(limit) {
        const vehicles = await this.prisma.vehicle.findMany({
            take: limit,
            include: {
                bookings: {
                    where: { status: client_1.BookingStatus.COMPLETED },
                },
                revenues: true,
            },
        });
        const mapped = vehicles.map((v) => {
            const revenueSum = v.revenues.reduce((sum, r) => sum + r.amount, 0);
            return {
                name: `${v.brand} ${v.model} (${v.plateNumber})`,
                bookingsCount: v.bookings.length,
                revenue: revenueSum,
            };
        });
        const sorted = mapped.sort((a, b) => b.revenue - a.revenue);
        const maxRevenue = sorted[0]?.revenue || 1;
        return sorted.map((car) => ({
            ...car,
            maxRevenue,
        }));
    }
    async getNotifications(limit) {
        return [
            {
                id: '1',
                title: 'Hợp đồng mới chờ duyệt',
                desc: 'Khách hàng Nguyễn Văn Khách vừa đặt xe VinFast VF8 30A-999.99.',
                date: '2026-06-24',
            },
            {
                id: '2',
                title: 'Yêu cầu bảo dưỡng định kỳ',
                desc: 'Xe Toyota Vios 30A-888.88 đến hạn thay dầu động cơ.',
                date: '2026-06-23',
            },
            {
                id: '3',
                title: 'Cập nhật chính sách mới',
                desc: 'Áp dụng bảo hiểm tự nguyện mở rộng cho tất cả xe từ tháng 7.',
                date: '2026-06-22',
            },
            {
                id: '4',
                title: 'Phản hồi khiếu nại',
                desc: 'Nhân viên đã trả lời ticket hỗ trợ mã TK-90123.',
                date: '2026-06-21',
            },
            {
                id: '5',
                title: 'Đăng ký chủ xe đối tác mới',
                desc: 'Chủ xe Trần Văn C vừa gửi yêu cầu duyệt thông tin xe.',
                date: '2026-06-20',
            },
        ].slice(0, limit);
    }
    async getCarNotifyList() {
        const vehicles = await this.prisma.vehicle.findMany({
            take: 2,
        });
        return vehicles.map((v) => ({
            id: v.id,
            plateNumber: v.plateNumber,
            brand: v.brand,
            model: v.model,
            type: 'Đến hạn đăng kiểm',
            dueDate: '2026-07-15',
        }));
    }
    async getCarViolateList() {
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
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map