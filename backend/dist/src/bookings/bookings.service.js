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
var BookingsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const redis_service_1 = require("../redis/redis.service");
const vehicles_service_1 = require("../vehicles/vehicles.service");
const payments_service_1 = require("../payments/payments.service");
const notification_service_1 = require("../notification/notification.service");
const client_1 = require("@prisma/client");
let BookingsService = BookingsService_1 = class BookingsService {
    prisma;
    redisService;
    vehiclesService;
    paymentsService;
    notificationService;
    logger = new common_1.Logger(BookingsService_1.name);
    constructor(prisma, redisService, vehiclesService, paymentsService, notificationService) {
        this.prisma = prisma;
        this.redisService = redisService;
        this.vehiclesService = vehiclesService;
        this.paymentsService = paymentsService;
        this.notificationService = notificationService;
    }
    async createBooking(dto) {
        const lockKey = `vehicle:${dto.vehicleId}`;
        this.logger.log(`Acquiring lock for ${lockKey}`);
        const locked = await this.redisService.acquireLock(lockKey, 5000);
        if (!locked) {
            throw new common_1.BadRequestException('Hệ thống đang xử lý yêu cầu đặt xe này. Vui lòng quay lại sau vài giây!');
        }
        try {
            const start = new Date(dto.startDate);
            const end = new Date(dto.endDate);
            const vehicle = await this.prisma.vehicle.findUnique({
                where: { id: dto.vehicleId },
            });
            if (!vehicle) {
                throw new common_1.NotFoundException('Không tìm thấy xe yêu cầu');
            }
            if (vehicle.status === 'LOCKED' || vehicle.status === 'MAINTENANCE') {
                throw new common_1.BadRequestException('Xe hiện tại không sẵn sàng để cho thuê (đang khóa hoặc bảo dưỡng)');
            }
            const conflict = await this.prisma.booking.findFirst({
                where: {
                    vehicleId: dto.vehicleId,
                    status: { in: ['CONFIRMED', 'RENTING', 'PENDING'] },
                    NOT: {
                        OR: [{ endDate: { lte: start } }, { startDate: { gte: end } }],
                    },
                },
            });
            if (conflict) {
                throw new common_1.BadRequestException('Xe đã bị đặt hoặc đang trong chuyến đi khác vào thời gian này. Vui lòng chọn xe khác!');
            }
            let customer = await this.prisma.customer.findUnique({
                where: { phone: dto.phone },
            });
            if (!customer) {
                customer = await this.prisma.customer.create({
                    data: {
                        fullName: dto.fullName,
                        phone: dto.phone,
                        idCardNo: dto.idCardNo,
                        segment: 'REGULAR',
                    },
                });
            }
            else {
                if (customer.segment === 'BLACKLIST') {
                    throw new common_1.BadRequestException('Tài khoản của bạn nằm trong danh sách đen (Blacklist). Vui lòng liên hệ Hotline.');
                }
                customer = await this.prisma.customer.update({
                    where: { id: customer.id },
                    data: {
                        fullName: dto.fullName,
                        idCardNo: dto.idCardNo,
                    },
                });
            }
            const pricing = this.vehiclesService.calculateTotalPrice(vehicle, start, end);
            let totalPrice = pricing.totalPrice;
            let discountAmount = 0;
            if (dto.couponCode) {
                const coupon = await this.prisma.coupon.findUnique({
                    where: { code: dto.couponCode },
                });
                if (coupon) {
                    const now = new Date();
                    if (now >= coupon.startDate &&
                        now <= coupon.endDate &&
                        coupon.usedCount < coupon.usageLimit) {
                        if (pricing.totalPrice >= coupon.minOrderValue) {
                            if (coupon.discountType === 'PERCENTAGE') {
                                discountAmount = (pricing.totalPrice * coupon.value) / 100;
                                if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
                                    discountAmount = coupon.maxDiscount;
                                }
                            }
                            else if (coupon.discountType === 'FIXED_AMOUNT') {
                                discountAmount = coupon.value;
                            }
                            totalPrice = Math.max(0, pricing.totalPrice - discountAmount);
                            await this.prisma.coupon.update({
                                where: { code: dto.couponCode },
                                data: { usedCount: { increment: 1 } },
                            });
                        }
                    }
                }
            }
            if (dto.affiliateCode) {
                const affiliate = await this.prisma.affiliate.findUnique({
                    where: { code: dto.affiliateCode },
                });
                if (affiliate) {
                    await this.prisma.customer.update({
                        where: { id: customer.id },
                        data: { affiliateId: affiliate.id },
                    });
                }
            }
            const insType = dto.insuranceType || 'NONE';
            let insFee = 0;
            if (insType === 'BASIC') {
                insFee = 100000 * pricing.totalDays;
            }
            else if (insType === 'PREMIUM') {
                insFee = 250000 * pricing.totalDays;
            }
            const depPercent = dto.depositPercent || 30.0;
            const depAmount = (totalPrice + insFee) * (depPercent / 100);
            const bookingNumber = `BK-${Date.now().toString().slice(-6)}-${Math.floor(10 + Math.random() * 90)}`;
            const result = await this.prisma.$transaction(async (tx) => {
                const booking = await tx.booking.create({
                    data: {
                        bookingNumber,
                        customerId: customer.id,
                        vehicleId: dto.vehicleId,
                        startDate: start,
                        endDate: end,
                        pickupLocation: dto.pickupLocation,
                        dropoffLocation: dto.dropoffLocation,
                        totalDays: pricing.totalDays,
                        basePrice: pricing.totalPrice,
                        discountAmount,
                        totalPrice,
                        status: client_1.BookingStatus.PENDING,
                        notes: dto.notes,
                        couponCode: dto.couponCode,
                        insuranceType: insType,
                        insuranceFee: insFee,
                        depositPercent: depPercent,
                        depositAmount: depAmount,
                    },
                });
                const payment = await tx.payment.create({
                    data: {
                        bookingId: booking.id,
                        amount: depAmount,
                        status: client_1.PaymentStatus.UNPAID,
                        method: dto.paymentMethod,
                    },
                });
                return { booking, payment };
            });
            const payGateway = await this.paymentsService.createPaymentUrl(result.booking.id, result.payment.amount, dto.paymentMethod);
            await this.prisma.payment.update({
                where: { bookingId: result.booking.id },
                data: { transactionId: payGateway.transactionId },
            });
            const emailContent = `
        <h3>Xác nhận đặt xe tự lái thành công</h3>
        <p>Xin chào ${dto.fullName},</p>
        <p>Mã đơn đặt xe của bạn là: <strong>${bookingNumber}</strong></p>
        <p>Xe: ${vehicle.brand} ${vehicle.model} - Biển số: ${vehicle.plateNumber}</p>
        <p>Thời gian: Từ ${dto.startDate} đến ${dto.endDate}</p>
        <p>Tổng tiền thanh toán: ${totalPrice.toLocaleString()} VND</p>
        <p>Vui lòng click vào link sau để tiến hành đặt cọc/thanh toán: <a href="${payGateway.paymentUrl}">Thanh toán ngay</a></p>
      `;
            await this.notificationService.sendEmail(dto.email, `[datxe] Xác nhận đặt xe ${bookingNumber}`, emailContent);
            const smsContent = `datxe: Dat xe ${bookingNumber} thanh cong cho xe ${vehicle.brand}. Vui long thanh toan: ${payGateway.paymentUrl}`;
            await this.notificationService.sendSMS(dto.phone, smsContent);
            return {
                booking: result.booking,
                paymentUrl: payGateway.paymentUrl,
                transactionId: payGateway.transactionId,
            };
        }
        finally {
            this.logger.log(`Releasing lock for ${lockKey}`);
            await this.redisService.releaseLock(lockKey);
        }
    }
    async trackBookings(phone) {
        const customer = await this.prisma.customer.findUnique({
            where: { phone },
        });
        if (!customer) {
            return [];
        }
        return await this.prisma.booking.findMany({
            where: { customerId: customer.id },
            include: {
                vehicle: true,
                payment: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findAll() {
        return await this.prisma.booking.findMany({
            include: {
                customer: true,
                vehicle: true,
                payment: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(id) {
        const booking = await this.prisma.booking.findUnique({
            where: { id },
            include: {
                customer: { include: { user: true } },
                vehicle: true,
                payment: true,
            },
        });
        if (!booking) {
            throw new common_1.NotFoundException(`Booking with ID ${id} not found`);
        }
        return booking;
    }
    async findOwnerBookings(ownerId) {
        return await this.prisma.booking.findMany({
            where: {
                vehicle: { ownerId },
            },
            include: {
                customer: true,
                vehicle: true,
                payment: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async updateStatus(id, status, user) {
        const currentBooking = await this.findOne(id);
        if (user.role === 'OWNER') {
            if (currentBooking.vehicle.ownerId !== user.id) {
                throw new common_1.BadRequestException('Bạn không sở hữu phương tiện của đơn đặt xe này.');
            }
        }
        const updated = await this.prisma.$transaction(async (tx) => {
            const book = await tx.booking.update({
                where: { id },
                data: {
                    status,
                    staffId: user.id,
                },
            });
            let vehicleStatus = client_1.VehicleStatus.AVAILABLE;
            if (status === client_1.BookingStatus.RENTING) {
                vehicleStatus = client_1.VehicleStatus.RENTED;
            }
            else if (status === client_1.BookingStatus.COMPLETED ||
                status === client_1.BookingStatus.CANCELLED) {
                vehicleStatus = client_1.VehicleStatus.AVAILABLE;
            }
            await tx.vehicle.update({
                where: { id: currentBooking.vehicleId },
                data: { status: vehicleStatus },
            });
            if (status === client_1.BookingStatus.COMPLETED &&
                currentBooking.customer.affiliateId) {
                const affiliate = await tx.affiliate.findUnique({
                    where: { id: currentBooking.customer.affiliateId },
                });
                if (affiliate) {
                    const commission = currentBooking.totalPrice * affiliate.commissionRate;
                    await tx.affiliate.update({
                        where: { id: affiliate.id },
                        data: { balance: { increment: commission } },
                    });
                }
            }
            await tx.auditLog.create({
                data: {
                    userId: user.id,
                    action: `UPDATE_STATUS_${status}`,
                    targetTable: 'Booking',
                    targetId: id,
                    oldValue: { status: currentBooking.status },
                    newValue: { status },
                },
            });
            return book;
        });
        const customerPhone = currentBooking.customer.phone;
        if (status === client_1.BookingStatus.CONFIRMED) {
            await this.notificationService.sendSMS(customerPhone, `datxe: Don hang ${currentBooking.bookingNumber} da duoc XAC NHAN. Hen gap ban luc nhan xe.`);
        }
        return updated;
    }
};
exports.BookingsService = BookingsService;
exports.BookingsService = BookingsService = BookingsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService,
        vehicles_service_1.VehiclesService,
        payments_service_1.PaymentsService,
        notification_service_1.NotificationService])
], BookingsService);
//# sourceMappingURL=bookings.service.js.map