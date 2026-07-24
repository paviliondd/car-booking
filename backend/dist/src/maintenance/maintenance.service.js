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
exports.MaintenanceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let MaintenanceService = class MaintenanceService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(data) {
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
            throw new common_1.BadRequestException(`Xe đang có đơn thuê ${activeBooking.bookingNumber} trùng ngày bảo dưỡng`);
        }
        await this.prisma.vehicle.update({
            where: { id: data.vehicleId },
            data: { status: client_1.VehicleStatus.MAINTENANCE },
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
    async complete(id, cost) {
        const maintenance = await this.prisma.maintenance.findUnique({
            where: { id },
        });
        if (!maintenance) {
            throw new common_1.NotFoundException('Không tìm thấy lịch bảo dưỡng');
        }
        const updated = await this.prisma.maintenance.update({
            where: { id },
            data: {
                completedDate: new Date(),
                cost,
            },
        });
        await this.prisma.vehicle.update({
            where: { id: maintenance.vehicleId },
            data: { status: client_1.VehicleStatus.AVAILABLE },
        });
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
    async findAll() {
        return await this.prisma.maintenance.findMany({
            include: { vehicle: true },
            orderBy: { scheduledDate: 'asc' },
        });
    }
    async getAlerts() {
        const sevenDaysLater = new Date();
        sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
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
            daysRemaining: Math.ceil((m.scheduledDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
        }));
    }
};
exports.MaintenanceService = MaintenanceService;
exports.MaintenanceService = MaintenanceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MaintenanceService);
//# sourceMappingURL=maintenance.service.js.map