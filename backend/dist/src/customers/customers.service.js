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
const client_1 = require("@prisma/client");
let CustomersService = class CustomersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll() {
        const customers = await this.prisma.customer.findMany({
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        role: true,
                    },
                },
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
                user: c.user,
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
    async update(id, dto, actorId) {
        const current = await this.findOne(id);
        try {
            return await this.prisma.$transaction(async (tx) => {
                const updated = await tx.customer.update({
                    where: { id },
                    data: dto,
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                                name: true,
                                role: true,
                            },
                        },
                    },
                });
                if (current.userId && (dto.fullName || dto.phone)) {
                    await tx.user.update({
                        where: { id: current.userId },
                        data: {
                            ...(dto.fullName ? { name: dto.fullName } : {}),
                            ...(dto.phone ? { phone: dto.phone } : {}),
                        },
                    });
                }
                await tx.auditLog.create({
                    data: {
                        userId: actorId,
                        action: 'UPDATE_CUSTOMER',
                        targetTable: 'Customer',
                        targetId: id,
                        oldValue: {
                            fullName: current.fullName,
                            phone: current.phone,
                            idCardNo: current.idCardNo,
                            segment: current.segment,
                            notes: current.notes,
                        },
                        newValue: { ...dto },
                    },
                });
                return updated;
            });
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2002') {
                throw new common_1.BadRequestException('Số điện thoại hoặc CCCD đã được sử dụng');
            }
            throw error;
        }
    }
    async delete(id, actorId) {
        const customer = await this.prisma.customer.findUnique({
            where: { id },
            include: {
                bookings: true,
            },
        });
        if (!customer) {
            throw new common_1.NotFoundException(`Không tìm thấy khách hàng với ID ${id}`);
        }
        const activeBookings = customer.bookings.filter((b) => ['PENDING', 'CONFIRMED', 'RENTING'].includes(b.status));
        if (activeBookings.length > 0) {
            throw new common_1.BadRequestException('Không thể xóa khách hàng đang có đơn đặt xe chưa hoàn thành hoặc chưa hủy. Vui lòng xử lý đơn trước khi xóa.');
        }
        return await this.prisma.$transaction(async (tx) => {
            await tx.review.deleteMany({
                where: { customerId: id },
            });
            const pastBookingIds = customer.bookings.map((b) => b.id);
            if (pastBookingIds.length > 0) {
                await tx.payment.deleteMany({
                    where: { bookingId: { in: pastBookingIds } },
                });
                await tx.contract.deleteMany({
                    where: { bookingId: { in: pastBookingIds } },
                });
                await tx.revenue.deleteMany({
                    where: { bookingId: { in: pastBookingIds } },
                });
                await tx.quickBookingRequest.updateMany({
                    where: { bookingId: { in: pastBookingIds } },
                    data: { bookingId: null },
                });
                await tx.booking.deleteMany({
                    where: { id: { in: pastBookingIds } },
                });
            }
            const deleted = await tx.customer.delete({
                where: { id },
            });
            await tx.auditLog.create({
                data: {
                    userId: actorId,
                    action: 'DELETE_CUSTOMER',
                    targetTable: 'Customer',
                    targetId: id,
                    oldValue: {
                        fullName: customer.fullName,
                        phone: customer.phone,
                        idCardNo: customer.idCardNo,
                        segment: customer.segment,
                    },
                },
            });
            return { success: true, id: deleted.id, fullName: deleted.fullName };
        });
    }
};
exports.CustomersService = CustomersService;
exports.CustomersService = CustomersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CustomersService);
//# sourceMappingURL=customers.service.js.map