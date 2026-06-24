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
exports.CustomersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let CustomersService = class CustomersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll() {
        const customers = await this.prisma.customer.findMany({
            include: {
                bookings: {
                    where: { status: 'COMPLETED' },
                    select: {
                        totalPrice: true,
                        startDate: true,
                    },
                },
            },
        });
        return customers.map((c) => {
            const totalBookings = c.bookings.length;
            const totalRevenue = c.bookings.reduce((sum, b) => sum + b.totalPrice, 0);
            let lastRentalDate = null;
            if (totalBookings > 0) {
                const sortedDates = c.bookings
                    .map((b) => b.startDate)
                    .sort((a, b) => b.getTime() - a.getTime());
                lastRentalDate = sortedDates[0];
            }
            return {
                id: c.id,
                fullName: c.fullName,
                phone: c.phone,
                idCardNo: c.idCardNo,
                segment: c.segment,
                notes: c.notes,
                totalBookings,
                totalRevenue,
                lastRentalDate,
                createdAt: c.createdAt,
            };
        });
    }
    async findOne(id) {
        const customer = await this.prisma.customer.findUnique({
            where: { id },
            include: {
                bookings: {
                    include: { vehicle: true, payment: true },
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
        if (!customer) {
            throw new common_1.NotFoundException(`Customer with ID ${id} not found`);
        }
        return customer;
    }
    async updateSegmentAndNotes(id, segment, notes) {
        await this.findOne(id);
        return await this.prisma.customer.update({
            where: { id },
            data: {
                segment,
                ...(notes !== undefined ? { notes } : {}),
            },
        });
    }
};
exports.CustomersService = CustomersService;
exports.CustomersService = CustomersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CustomersService);
//# sourceMappingURL=customers.service.js.map