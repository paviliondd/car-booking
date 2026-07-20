import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentStatus } from '@prisma/client';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // Webhook nhận kết quả từ MoMo
  @Post('momo-webhook')
  @HttpCode(HttpStatus.OK)
  async momoWebhook(@Body() body: Record<string, unknown>) {
    if (!this.paymentsService.verifyMomoSignature(body)) {
      throw new BadRequestException('Chữ ký webhook MoMo không hợp lệ');
    }

    const orderId = this.asString(body.orderId);
    const resultCode = Number(body.resultCode);
    const extraData = this.asString(body.extraData);
    let bookingId = '';
    if (extraData) {
      try {
        bookingId = Buffer.from(extraData, 'base64').toString('utf8');
      } catch {
        bookingId = '';
      }
    }
    if (!bookingId && orderId) {
      bookingId = orderId.split('_')[0]; // Quy ước đặt orderId
    }

    if (resultCode === 0 && bookingId) {
      await this.paymentsService.verifyPayment(
        bookingId,
        orderId,
        PaymentStatus.PAID,
      );
    }
    return {
      partnerCode: body.partnerCode,
      orderId,
      requestId: body.requestId,
      resultCode,
      message: body.message,
    };
  }

  private asString(value: unknown): string {
    return typeof value === 'string' || typeof value === 'number'
      ? String(value)
      : '';
  }

  // Webhook nhận kết quả từ PayOS
  @Post('payos-webhook')
  @HttpCode(HttpStatus.OK)
  async payosWebhook(@Body() body: Record<string, unknown>) {
    await this.paymentsService.handlePayosWebhook(body);
    return { status: 'success' };
  }
}
