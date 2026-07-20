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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsController = void 0;
const common_1 = require("@nestjs/common");
const payments_service_1 = require("./payments.service");
const client_1 = require("@prisma/client");
let PaymentsController = class PaymentsController {
    paymentsService;
    constructor(paymentsService) {
        this.paymentsService = paymentsService;
    }
    async momoWebhook(body) {
        if (!this.paymentsService.verifyMomoSignature(body)) {
            throw new common_1.BadRequestException('Chữ ký webhook MoMo không hợp lệ');
        }
        const orderId = this.asString(body.orderId);
        const resultCode = Number(body.resultCode);
        const extraData = this.asString(body.extraData);
        let bookingId = '';
        if (extraData) {
            try {
                bookingId = Buffer.from(extraData, 'base64').toString('utf8');
            }
            catch {
                bookingId = '';
            }
        }
        if (!bookingId && orderId) {
            bookingId = orderId.split('_')[0];
        }
        if (resultCode === 0 && bookingId) {
            await this.paymentsService.verifyPayment(bookingId, orderId, client_1.PaymentStatus.PAID);
        }
        return {
            partnerCode: body.partnerCode,
            orderId,
            requestId: body.requestId,
            resultCode,
            message: body.message,
        };
    }
    asString(value) {
        return typeof value === 'string' || typeof value === 'number'
            ? String(value)
            : '';
    }
    async payosWebhook(body) {
        await this.paymentsService.handlePayosWebhook(body);
        return { status: 'success' };
    }
};
exports.PaymentsController = PaymentsController;
__decorate([
    (0, common_1.Post)('momo-webhook'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "momoWebhook", null);
__decorate([
    (0, common_1.Post)('payos-webhook'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "payosWebhook", null);
exports.PaymentsController = PaymentsController = __decorate([
    (0, common_1.Controller)('payments'),
    __metadata("design:paramtypes", [payments_service_1.PaymentsService])
], PaymentsController);
//# sourceMappingURL=payments.controller.js.map