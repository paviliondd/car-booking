import { Controller, Post, Body, Query, HttpCode, HttpStatus, Get, Res, Redirect } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentStatus } from '@prisma/client';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // Webhook nhận kết quả từ MoMo
  @Post('momo-webhook')
  @HttpCode(HttpStatus.OK)
  async momoWebhook(@Body() body: any) {
    // MoMo callback payload
    const { orderId, resultCode, message, extraData } = body;
    // extraData có chứa bookingId được truyền từ lúc tạo
    let bookingId = extraData;
    if (!bookingId && orderId) {
      bookingId = orderId.split('_')[0]; // Quy ước đặt orderId
    }

    if (resultCode === 0 && bookingId) {
      await this.paymentsService.verifyPayment(bookingId, orderId, PaymentStatus.PAID);
    }
    return {
      partnerCode: body.partnerCode,
      orderId: body.orderId,
      requestId: body.requestId,
      resultCode: body.resultCode,
      message: body.message,
      responseTime: body.responseTime,
      extraData: body.extraData,
      signature: body.signature,
    };
  }

  // Webhook nhận kết quả từ PayOS
  @Post('payos-webhook')
  @HttpCode(HttpStatus.OK)
  async payosWebhook(@Body() body: any) {
    const { data, success } = body;
    if (success && data) {
      const { orderCode, description } = data;
      // Trích xuất bookingId từ description hoặc từ DB qua orderCode
      // Ở đây ta giả sử callback thành công
      // Tìm booking bằng orderCode trong DB
      // Nhằm đơn giản hóa luồng demo, nếu callback thành công:
      // data.orderCode tương ứng với transactionId
    }
    return { status: 'success' };
  }

  // Mock Payment Flow endpoint để người dùng click "Simulate Success"
  @Get('simulate-success')
  async simulateSuccess(
    @Query('bookingId') bookingId: string,
    @Query('transactionId') transactionId: string,
    @Query('method') method: string,
  ) {
    await this.paymentsService.verifyPayment(bookingId, transactionId, PaymentStatus.PAID);
    return {
      success: true,
      message: `Thanh toan gia lap thanh cong qua ${method} cho booking ${bookingId}`,
    };
  }
}
