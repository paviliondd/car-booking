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
const rental_location_1 = require("../common/rental-location");
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
    async create(dto, ownerId) {
        return await this.prisma.vehicle.create({
            data: {
                ...dto,
                images: dto.images || [],
                status: client_1.VehicleStatus.AVAILABLE,
                ownerId: ownerId || null,
                pickupLocation: rental_location_1.RENTAL_LOCATION.address,
                latitude: rental_location_1.RENTAL_LOCATION.latitude,
                longitude: rental_location_1.RENTAL_LOCATION.longitude,
            },
        });
    }
    async findByOwner(ownerId) {
        return await this.prisma.vehicle.findMany({
            where: { ownerId },
        });
    }
    async findAll(filters) {
        return await this.prisma.vehicle.findMany({
            where: {
                ...(filters.brand
                    ? { brand: { contains: filters.brand, mode: 'insensitive' } }
                    : {}),
                ...(filters.seats ? { seats: filters.seats } : {}),
            },
        });
    }
    async findAvailableNow(filters) {
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
                    notIn: [client_1.VehicleStatus.LOCKED, client_1.VehicleStatus.MAINTENANCE],
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
                status: {
                    notIn: [client_1.VehicleStatus.LOCKED, client_1.VehicleStatus.MAINTENANCE],
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
    async findOne(id) {
        const vehicle = await this.prisma.vehicle.findUnique({ where: { id } });
        if (!vehicle) {
            throw new common_1.NotFoundException(`Vehicle with ID ${id} not found`);
        }
        return vehicle;
    }
    async getCalendar(id, fromValue, toValue) {
        const vehicle = await this.findOne(id);
        const from = fromValue ? new Date(fromValue) : new Date();
        const to = toValue
            ? new Date(toValue)
            : new Date(from.getTime() + 180 * 86_400_000);
        if (Number.isNaN(from.getTime()) ||
            Number.isNaN(to.getTime()) ||
            from >= to) {
            throw new common_1.BadRequestException('Khoảng thời gian xem lịch không hợp lệ');
        }
        if (to.getTime() - from.getTime() > 366 * 86_400_000) {
            throw new common_1.BadRequestException('Chỉ có thể xem lịch tối đa 366 ngày');
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
                    type: 'BOOKING',
                    label: 'Đã có lịch thuê',
                    startDate: booking.startDate,
                    endDate: booking.endDate,
                })),
                ...maintenances.map((maintenance) => ({
                    type: 'MAINTENANCE',
                    label: 'Lịch bảo dưỡng',
                    startDate: maintenance.scheduledDate,
                    endDate: new Date(maintenance.scheduledDate.getTime() + 86_400_000),
                })),
            ].sort((left, right) => left.startDate.getTime() - right.startDate.getTime()),
        };
    }
    assertCanManage(vehicle, actor) {
        if (actor.role === client_1.Role.OWNER && vehicle.ownerId !== actor.id) {
            throw new common_1.BadRequestException('Bạn không sở hữu phương tiện này');
        }
    }
    async update(id, dto, actor) {
        const current = await this.findOne(id);
        this.assertCanManage(current, actor);
        const operationalFields = [
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
        if (current.status === client_1.VehicleStatus.RENTED &&
            operationalFields.some((field) => dto[field] !== undefined)) {
            throw new common_1.BadRequestException('Không thể đổi thông tin vận hành hoặc giá khi xe đang được thuê');
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
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2002') {
                throw new common_1.BadRequestException('Biển số xe đã tồn tại');
            }
            throw error;
        }
    }
    async updateStatus(id, status, actor) {
        const current = await this.findOne(id);
        this.assertCanManage(current, actor);
        if (current.status === client_1.VehicleStatus.RENTED &&
            status !== client_1.VehicleStatus.RENTED) {
            throw new common_1.BadRequestException('Trạng thái xe đang thuê được cập nhật theo vòng đời đơn thuê');
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
    async delete(id, actor) {
        const current = await this.findOne(id);
        this.assertCanManage(current, actor);
        if (current.status === client_1.VehicleStatus.RENTED) {
            throw new common_1.BadRequestException('Không thể xóa xe đang được thuê');
        }
        await this.prisma.vehicle.delete({ where: { id } });
    }
    async findSuggestions(brand, seats, startDateStr, endDateStr) {
        const available = await this.findAvailable(startDateStr, endDateStr, {});
        return available
            .filter((v) => v.seats === seats || v.brand.toLowerCase() === brand.toLowerCase())
            .slice(0, 3);
    }
};
exports.VehiclesService = VehiclesService;
exports.VehiclesService = VehiclesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], VehiclesService);
//# sourceMappingURL=vehicles.service.js.map