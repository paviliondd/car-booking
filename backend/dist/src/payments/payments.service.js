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
var PaymentsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const PayOS = require('@payos/node');
let PaymentsService = PaymentsService_1 = class PaymentsService {
    configService;
    prisma;
    payos = null;
    logger = new common_1.Logger(PaymentsService_1.name);
    constructor(configService, prisma) {
        this.configService = configService;
        this.prisma = prisma;
        const payosClientId = this.configService.get('PAYOS_CLIENT_ID');
        const payosApiKey = this.configService.get('PAYOS_API_KEY');
        const payosChecksumKey = this.configService.get('PAYOS_CHECKSUM_KEY');
        if (payosClientId && payosApiKey && payosChecksumKey && payosClientId !== 'mock_payos_client_id') {
            try {
                this.payos = new PayOS(payosClientId, payosApiKey, payosChecksumKey);
                this.logger.log('PayOS SDK initialized successfully.');
            }
            catch (error) {
                this.logger.error('Failed to initialize PayOS Client', error);
            }
        }
        else {
            this.logger.warn('PayOS config missing or mock. VietQR payment will run in MOCK mode.');
        }
    }
    async createPaymentUrl(bookingId, amount, method) {
        const transactionId = `TX-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
        if (method === client_1.PaymentMethod.MOMO) {
            const partnerCode = this.configService.get('MOMO_PARTNER_CODE');
            this.logger.log(`Creating MoMo payment link for Booking ${bookingId}, amount: ${amount}`);
            let paymentUrl = `https://datxe.linuxunity.com/momo-payment-mock?bookingId=${bookingId}&amount=${amount}&transactionId=${transactionId}`;
            if (partnerCode && partnerCode !== 'MOMO_MOCK_PARTNER') {
                this.logger.log('MoMo integration enabled via environment variables.');
            }
            return { paymentUrl, transactionId };
        }
        if (method === client_1.PaymentMethod.BANK_TRANSFER) {
            this.logger.log(`Creating PayOS (VietQR) payment link for Booking ${bookingId}, amount: ${amount}`);
            if (this.payos) {
                try {
                    const orderCode = Math.floor(100000 + Math.random() * 900000);
                    const paymentLinkData = {
                        orderCode,
                        amount,
                        description: `Thanh toan xe ${bookingId.slice(0, 8)}`,
                        cancelUrl: `https://datxe.linuxunity.com/bookings/payment-cancelled?bookingId=${bookingId}`,
                        returnUrl: `https://datxe.linuxunity.com/bookings/payment-success?bookingId=${bookingId}`,
                    };
                    const paymentLinkRes = await this.payos.createPaymentLink(paymentLinkData);
                    return {
                        paymentUrl: paymentLinkRes.checkoutUrl,
                        transactionId: orderCode.toString(),
                    };
                }
                catch (error) {
                    this.logger.error('Error creating PayOS payment link, falling back to mock.', error);
                }
            }
            const mockBankBin = '970415';
            const mockAccountNo = '101234567890';
            const mockAccountName = 'CONG TY CHO THUE XE AN TIEP';
            const vietQrUrl = `https://img.vietqr.io/image/${mockBankBin}-${mockAccountNo}-compact2.png?amount=${amount}&addInfo=datxe_${bookingId.slice(0, 8)}&accountName=${encodeURIComponent(mockAccountName)}`;
            const paymentUrl = `https://datxe.linuxunity.com/vietqr-payment-mock?qrUrl=${encodeURIComponent(vietQrUrl)}&bookingId=${bookingId}&amount=${amount}&transactionId=${transactionId}`;
            return { paymentUrl, transactionId };
        }
        return {
            paymentUrl: `https://datxe.linuxunity.com/bookings/payment-cash?bookingId=${bookingId}`,
            transactionId,
        };
    }
    async verifyPayment(bookingId, transactionId, status) {
        this.logger.log(`Verifying payment for Booking: ${bookingId}, Tx: ${transactionId}, status: ${status}`);
        const booking = await this.prisma.booking.findUnique({
            where: { id: bookingId },
            include: { payment: true },
        });
        if (!booking) {
            throw new common_1.BadRequestException('Booking not found');
        }
        await this.prisma.$transaction([
            this.prisma.payment.update({
                where: { bookingId },
                data: {
                    status,
                    transactionId,
                    paidAt: status === client_1.PaymentStatus.PAID || status === client_1.PaymentStatus.DEPOSITED ? new Date() : null,
                },
            }),
            this.prisma.booking.update({
                where: { id: bookingId },
                data: {
                    status: status === client_1.PaymentStatus.PAID || status === client_1.PaymentStatus.DEPOSITED ? 'CONFIRMED' : 'PENDING',
                },
            }),
            ...(status === client_1.PaymentStatus.PAID || status === client_1.PaymentStatus.DEPOSITED
                ? [
                    this.prisma.revenue.create({
                        data: {
                            bookingId: bookingId,
                            vehicleId: booking.vehicleId,
                            amount: booking.totalPrice,
                            date: new Date(),
                        },
                    }),
                ]
                : []),
        ]);
        return true;
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = PaymentsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map