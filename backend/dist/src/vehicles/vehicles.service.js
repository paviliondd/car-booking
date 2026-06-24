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
exports.VehiclesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let VehiclesService = class VehiclesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    VIETNAM_HOLIDAYS = [
        '01-01',
        '04-30',
        '05-01',
        '09-02',
    ];
    isHoliday(date) {
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const checkStr = `${month}-${day}`;
        return this.VIETNAM_HOLIDAYS.includes(checkStr);
    }
    calculateTotalPrice(vehicle, start, end) {
        if (start >= end) {
            throw new common_1.BadRequestException('End date must be greater than start date');
        }
        let totalPrice = 0;
        const details = [];
        const current = new Date(start);
        let totalDays = 0;
        while (current < end) {
            const dayOfWeek = current.getDay();
            let price = vehicle.dailyPrice;
            let type = 'Ngày thường';
            if (this.isHoliday(current)) {
                price = vehicle.holidayPrice;
                type = 'Ngày lễ';
            }
            else if (dayOfWeek === 0 || dayOfWeek === 6) {
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
    async create(dto) {
        return await this.prisma.vehicle.create({
            data: {
                ...dto,
                images: dto.images || [],
                status: client_1.VehicleStatus.AVAILABLE,
            },
        });
    }
    async findAll(filters) {
        return await this.prisma.vehicle.findMany({
            where: {
                ...(filters.brand ? { brand: { contains: filters.brand, mode: 'insensitive' } } : {}),
                ...(filters.seats ? { seats: filters.seats } : {}),
            },
        });
    }
    async findAvailable(startDateStr, endDateStr, filters) {
        const startDate = new Date(startDateStr);
        const endDate = new Date(endDateStr);
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            throw new common_1.BadRequestException('Invalid start or end date');
        }
        if (startDate >= endDate) {
            throw new common_1.BadRequestException('Start date must be before end date');
        }
        const bookedVehicles = await this.prisma.booking.findMany({
            where: {
                status: { in: ['CONFIRMED', 'RENTING', 'PENDING'] },
                NOT: {
                    OR: [
                        { endDate: { lte: startDate } },
                        { startDate: { gte: endDate } },
                    ],
                },
            },
            select: { vehicleId: true },
        });
        const bookedIds = bookedVehicles.map((b) => b.vehicleId);
        return await this.prisma.vehicle.findMany({
            where: {
                status: client_1.VehicleStatus.AVAILABLE,
                id: { notIn: bookedIds },
                ...(filters.brand ? { brand: { contains: filters.brand, mode: 'insensitive' } } : {}),
                ...(filters.seats ? { seats: filters.seats } : {}),
            },
        });
    }
    async findOne(id) {
        const vehicle = await this.prisma.vehicle.findUnique({ where: { id } });
        if (!vehicle) {
            throw new common_1.NotFoundException(`Vehicle with ID ${id} not found`);
        }
        return vehicle;
    }
    async getCalendar(id) {
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
    async update(id, dto) {
        await this.findOne(id);
        return await this.prisma.vehicle.update({
            where: { id },
            data: dto,
        });
    }
    async updateStatus(id, status) {
        await this.findOne(id);
        return await this.prisma.vehicle.update({
            where: { id },
            data: { status },
        });
    }
    async delete(id) {
        await this.findOne(id);
        await this.prisma.vehicle.delete({ where: { id } });
    }
    async findSuggestions(brand, seats, startDateStr, endDateStr) {
        const available = await this.findAvailable(startDateStr, endDateStr, {});
        return available.filter((v) => v.seats === seats || v.brand.toLowerCase() === brand.toLowerCase()).slice(0, 3);
    }
};
exports.VehiclesService = VehiclesService;
exports.VehiclesService = VehiclesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], VehiclesService);
//# sourceMappingURL=vehicles.service.js.map