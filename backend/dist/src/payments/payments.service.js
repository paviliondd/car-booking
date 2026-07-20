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
const node_crypto_1 = require("node:crypto");
const node_1 = require("@payos/node");
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
        if (payosClientId &&
            payosApiKey &&
            payosChecksumKey &&
            payosClientId !== 'mock_payos_client_id') {
            try {
                this.payos = new node_1.PayOS({
                    clientId: payosClientId,
                    apiKey: payosApiKey,
                    checksumKey: payosChecksumKey,
                });
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
    asString(value) {
        return typeof value === 'string' || typeof value === 'number'
            ? String(value)
            : '';
    }
    verifyMomoSignature(body) {
        const accessKey = this.configService.get('MOMO_ACCESS_KEY');
        const secretKey = this.configService.get('MOMO_SECRET_KEY');
        const received = this.asString(body.signature);
        if (!accessKey || !secretKey || !received)
            return false;
        const rawSignature = [
            `accessKey=${accessKey}`,
            `amount=${this.asString(body.amount)}`,
            `extraData=${this.asString(body.extraData)}`,
            `message=${this.asString(body.message)}`,
            `orderId=${this.asString(body.orderId)}`,
            `orderInfo=${this.asString(body.orderInfo)}`,
            `orderType=${this.asString(body.orderType)}`,
            `partnerCode=${this.asString(body.partnerCode)}`,
            `payType=${this.asString(body.payType)}`,
            `requestId=${this.asString(body.requestId)}`,
            `responseTime=${this.asString(body.responseTime)}`,
            `resultCode=${this.asString(body.resultCode)}`,
            `transId=${this.asString(body.transId)}`,
        ].join('&');
        const expected = (0, node_crypto_1.createHmac)('sha256', secretKey)
            .update(rawSignature)
            .digest('hex');
        const expectedBuffer = Buffer.from(expected);
        const receivedBuffer = Buffer.from(received);
        return (expectedBuffer.length === receivedBuffer.length &&
            (0, node_crypto_1.timingSafeEqual)(expectedBuffer, receivedBuffer));
    }
    async handlePayosWebhook(body) {
        if (!this.payos) {
            throw new common_1.ServiceUnavailableException('PayOS chưa được cấu hình');
        }
        let data;
        try {
            data = await this.payos.webhooks.verify(body);
        }
        catch {
            throw new common_1.BadRequestException('Chữ ký webhook PayOS không hợp lệ');
        }
        if (data.code !== '00')
            return;
        const transactionId = String(data.orderCode);
        const payment = await this.prisma.payment.findUnique({
            where: { transactionId },
            select: { bookingId: true },
        });
        if (!payment) {
            throw new common_1.BadRequestException('Không tìm thấy giao dịch PayOS');
        }
        await this.verifyPayment(payment.bookingId, transactionId, client_1.PaymentStatus.PAID);
    }
    async createPaymentUrl(bookingId, amount, method) {
        const transactionId = `TX-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
        if (method === client_1.PaymentMethod.MOMO) {
            const partnerCode = this.configService.get('MOMO_PARTNER_CODE');
            const accessKey = this.configService.get('MOMO_ACCESS_KEY');
            const secretKey = this.configService.get('MOMO_SECRET_KEY');
            const apiUrl = this.configService.get('MOMO_API_URL');
            const redirectUrl = this.configService.get('MOMO_REDIRECT_URL');
            const ipnUrl = this.configService.get('MOMO_IPN_URL');
            this.logger.log(`Creating MoMo payment link for Booking ${bookingId}, amount: ${amount}`);
            if (!partnerCode ||
                !accessKey ||
                !secretKey ||
                !apiUrl ||
                !redirectUrl ||
                !ipnUrl) {
                if (this.configService.get('ENABLE_PAYMENT_MOCKS') === 'true') {
                    return {
                        paymentUrl: `${redirectUrl || 'http://localhost:3000/payment'}?bookingId=${bookingId}&mock=true`,
                        transactionId,
                    };
                }
                throw new common_1.ServiceUnavailableException('MoMo chưa được cấu hình đầy đủ');
            }
            const requestId = transactionId;
            const orderId = transactionId;
            const orderInfo = `Thanh toan dat xe ${bookingId.slice(0, 8)}`;
            const extraData = Buffer.from(bookingId, 'utf8').toString('base64');
            const requestType = 'captureWallet';
            const rawSignature = [
                `accessKey=${accessKey}`,
                `amount=${amount}`,
                `extraData=${extraData}`,
                `ipnUrl=${ipnUrl}`,
                `orderId=${orderId}`,
                `orderInfo=${orderInfo}`,
                `partnerCode=${partnerCode}`,
                `redirectUrl=${redirectUrl}`,
                `requestId=${requestId}`,
                `requestType=${requestType}`,
            ].join('&');
            const signature = (0, node_crypto_1.createHmac)('sha256', secretKey)
                .update(rawSignature)
                .digest('hex');
            try {
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        partnerCode,
                        partnerName: 'datxe',
                        storeId: 'datxe',
                        requestId,
                        amount,
                        orderId,
                        orderInfo,
                        redirectUrl,
                        ipnUrl,
                        lang: 'vi',
                        requestType,
                        autoCapture: true,
                        extraData,
                        signature,
                    }),
                    signal: AbortSignal.timeout(30_000),
                });
                const result = (await response.json());
                if (!response.ok || result.resultCode !== 0 || !result.payUrl) {
                    this.logger.error(`MoMo rejected payment request: ${result.message || response.statusText}`);
                    throw new common_1.ServiceUnavailableException('Không thể tạo liên kết thanh toán MoMo');
                }
                return { paymentUrl: result.payUrl, transactionId };
            }
            catch (error) {
                if (error instanceof common_1.ServiceUnavailableException)
                    throw error;
                this.logger.error('Không thể kết nối cổng thanh toán MoMo', error);
                throw new common_1.ServiceUnavailableException('Cổng thanh toán MoMo tạm thời không khả dụng');
            }
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
                    const paymentLinkRes = await this.payos.paymentRequests.create(paymentLinkData);
                    return {
                        paymentUrl: paymentLinkRes.checkoutUrl,
                        transactionId: orderCode.toString(),
                    };
                }
                catch (error) {
                    this.logger.error('Không thể tạo liên kết PayOS.', error);
                    throw new common_1.ServiceUnavailableException('Cổng thanh toán PayOS tạm thời không khả dụng');
                }
            }
            if (this.configService.get('ENABLE_PAYMENT_MOCKS') !== 'true') {
                throw new common_1.ServiceUnavailableException('PayOS chưa được cấu hình');
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
        if (booking.payment?.status === client_1.PaymentStatus.PAID &&
            booking.payment.transactionId === transactionId) {
            return true;
        }
        const shouldRecordRevenue = (status === client_1.PaymentStatus.PAID || status === client_1.PaymentStatus.DEPOSITED) &&
            booking.payment?.status !== client_1.PaymentStatus.PAID &&
            booking.payment?.status !== client_1.PaymentStatus.DEPOSITED;
        await this.prisma.$transaction([
            this.prisma.payment.update({
                where: { bookingId },
                data: {
                    status,
                    transactionId,
                    paidAt: status === client_1.PaymentStatus.PAID || status === client_1.PaymentStatus.DEPOSITED
                        ? new Date()
                        : null,
                },
            }),
            this.prisma.booking.update({
                where: { id: bookingId },
                data: {
                    status: status === client_1.PaymentStatus.PAID || status === client_1.PaymentStatus.DEPOSITED
                        ? 'CONFIRMED'
                        : 'PENDING',
                },
            }),
            ...(shouldRecordRevenue
                ? [
                    this.prisma.revenue.create({
                        data: {
                            bookingId: bookingId,
                            vehicleId: booking.vehicleId,
                            amount: booking.payment?.amount ?? booking.totalPrice,
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