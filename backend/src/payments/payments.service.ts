import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentMethod, PaymentStatus } from '@prisma/client';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { PayOS, type Webhook, type WebhookData } from '@payos/node';

type PayOSClient = InstanceType<typeof PayOS>;
type MomoCreateResponse = {
  resultCode: number;
  message?: string;
  payUrl?: string;
  deeplink?: string;
};

@Injectable()
export class PaymentsService {
  private payos: PayOSClient | null = null;
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const payosClientId = this.configService.get<string>('PAYOS_CLIENT_ID');
    const payosApiKey = this.configService.get<string>('PAYOS_API_KEY');
    const payosChecksumKey =
      this.configService.get<string>('PAYOS_CHECKSUM_KEY');

    if (
      payosClientId &&
      payosApiKey &&
      payosChecksumKey &&
      payosClientId !== 'mock_payos_client_id'
    ) {
      try {
        this.payos = new PayOS({
          clientId: payosClientId,
          apiKey: payosApiKey,
          checksumKey: payosChecksumKey,
        });
        this.logger.log('PayOS SDK initialized successfully.');
      } catch (error) {
        this.logger.error('Failed to initialize PayOS Client', error);
      }
    } else {
      this.logger.warn(
        'PayOS config missing or mock. VietQR payment will run in MOCK mode.',
      );
    }
  }

  private asString(value: unknown): string {
    return typeof value === 'string' || typeof value === 'number'
      ? String(value)
      : '';
  }

  verifyMomoSignature(body: Record<string, unknown>): boolean {
    const accessKey = this.configService.get<string>('MOMO_ACCESS_KEY');
    const secretKey = this.configService.get<string>('MOMO_SECRET_KEY');
    const received = this.asString(body.signature);
    if (!accessKey || !secretKey || !received) return false;

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
    const expected = createHmac('sha256', secretKey)
      .update(rawSignature)
      .digest('hex');

    const expectedBuffer = Buffer.from(expected);
    const receivedBuffer = Buffer.from(received);
    return (
      expectedBuffer.length === receivedBuffer.length &&
      timingSafeEqual(expectedBuffer, receivedBuffer)
    );
  }

  async handlePayosWebhook(body: Record<string, unknown>): Promise<void> {
    if (!this.payos) {
      throw new ServiceUnavailableException('PayOS chưa được cấu hình');
    }

    let data: WebhookData;
    try {
      data = await this.payos.webhooks.verify(body as Webhook);
    } catch {
      throw new BadRequestException('Chữ ký webhook PayOS không hợp lệ');
    }

    if (data.code !== '00') return;

    const transactionId = String(data.orderCode);
    const payment = await this.prisma.payment.findUnique({
      where: { transactionId },
      select: { bookingId: true },
    });
    if (!payment) {
      throw new BadRequestException('Không tìm thấy giao dịch PayOS');
    }

    await this.verifyPayment(
      payment.bookingId,
      transactionId,
      PaymentStatus.PAID,
    );
  }

  async createPaymentUrl(
    bookingId: string,
    amount: number,
    method: PaymentMethod,
  ): Promise<{ paymentUrl: string; transactionId: string }> {
    const transactionId = `TX-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    if (method === PaymentMethod.MOMO) {
      const partnerCode = this.configService.get<string>('MOMO_PARTNER_CODE');
      const accessKey = this.configService.get<string>('MOMO_ACCESS_KEY');
      const secretKey = this.configService.get<string>('MOMO_SECRET_KEY');
      const apiUrl = this.configService.get<string>('MOMO_API_URL');
      const redirectUrl = this.configService.get<string>('MOMO_REDIRECT_URL');
      const ipnUrl = this.configService.get<string>('MOMO_IPN_URL');
      this.logger.log(
        `Creating MoMo payment link for Booking ${bookingId}, amount: ${amount}`,
      );

      if (
        !partnerCode ||
        !accessKey ||
        !secretKey ||
        !apiUrl ||
        !redirectUrl ||
        !ipnUrl
      ) {
        if (this.configService.get<string>('ENABLE_PAYMENT_MOCKS') === 'true') {
          return {
            paymentUrl: `${redirectUrl || 'http://localhost:3000/payment'}?bookingId=${bookingId}&mock=true`,
            transactionId,
          };
        }
        throw new ServiceUnavailableException('MoMo chưa được cấu hình đầy đủ');
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
      const signature = createHmac('sha256', secretKey)
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
        const result = (await response.json()) as MomoCreateResponse;
        if (!response.ok || result.resultCode !== 0 || !result.payUrl) {
          this.logger.error(
            `MoMo rejected payment request: ${result.message || response.statusText}`,
          );
          throw new ServiceUnavailableException(
            'Không thể tạo liên kết thanh toán MoMo',
          );
        }
        return { paymentUrl: result.payUrl, transactionId };
      } catch (error) {
        if (error instanceof ServiceUnavailableException) throw error;
        this.logger.error('Không thể kết nối cổng thanh toán MoMo', error);
        throw new ServiceUnavailableException(
          'Cổng thanh toán MoMo tạm thời không khả dụng',
        );
      }
    }

    if (method === PaymentMethod.BANK_TRANSFER) {
      this.logger.log(
        `Creating PayOS (VietQR) payment link for Booking ${bookingId}, amount: ${amount}`,
      );

      if (this.payos) {
        try {
          const orderCode = Math.floor(100000 + Math.random() * 900000); // PayOS requires integer orderCode
          const paymentLinkData = {
            orderCode,
            amount,
            description: `Thanh toan xe ${bookingId.slice(0, 8)}`,
            cancelUrl: `https://datxe.linuxunity.com/bookings/payment-cancelled?bookingId=${bookingId}`,
            returnUrl: `https://datxe.linuxunity.com/bookings/payment-success?bookingId=${bookingId}`,
          };

          const paymentLinkRes =
            await this.payos.paymentRequests.create(paymentLinkData);
          return {
            paymentUrl: paymentLinkRes.checkoutUrl,
            transactionId: orderCode.toString(),
          };
        } catch (error) {
          this.logger.error('Không thể tạo liên kết PayOS.', error);
          throw new ServiceUnavailableException(
            'Cổng thanh toán PayOS tạm thời không khả dụng',
          );
        }
      }

      if (this.configService.get<string>('ENABLE_PAYMENT_MOCKS') !== 'true') {
        throw new ServiceUnavailableException('PayOS chưa được cấu hình');
      }

      // Dữ liệu mock chỉ được bật rõ ràng trong môi trường phát triển.
      // Dùng API mở VietQR để sinh mã QR chuyển khoản thật của Ngân hàng người dùng (nếu có tài khoản)
      const mockBankBin = '970415'; // VietinBank
      const mockAccountNo = '101234567890';
      const mockAccountName = 'CONG TY CHO THUE XE AN TIEP';
      const vietQrUrl = `https://img.vietqr.io/image/${mockBankBin}-${mockAccountNo}-compact2.png?amount=${amount}&addInfo=datxe_${bookingId.slice(0, 8)}&accountName=${encodeURIComponent(mockAccountName)}`;

      const paymentUrl = `https://datxe.linuxunity.com/vietqr-payment-mock?qrUrl=${encodeURIComponent(vietQrUrl)}&bookingId=${bookingId}&amount=${amount}&transactionId=${transactionId}`;
      return { paymentUrl, transactionId };
    }

    // Tiền mặt
    return {
      paymentUrl: `https://datxe.linuxunity.com/bookings/payment-cash?bookingId=${bookingId}`,
      transactionId,
    };
  }

  async verifyPayment(
    bookingId: string,
    transactionId: string,
    status: PaymentStatus,
  ): Promise<boolean> {
    this.logger.log(
      `Verifying payment for Booking: ${bookingId}, Tx: ${transactionId}, status: ${status}`,
    );

    // Cập nhật trạng thái Payment và Booking
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { payment: true },
    });

    if (!booking) {
      throw new BadRequestException('Booking not found');
    }

    if (
      booking.payment?.status === PaymentStatus.PAID &&
      booking.payment.transactionId === transactionId
    ) {
      return true;
    }

    const shouldRecordRevenue =
      (status === PaymentStatus.PAID || status === PaymentStatus.DEPOSITED) &&
      booking.payment?.status !== PaymentStatus.PAID &&
      booking.payment?.status !== PaymentStatus.DEPOSITED;

    await this.prisma.$transaction([
      this.prisma.payment.update({
        where: { bookingId },
        data: {
          status,
          transactionId,
          paidAt:
            status === PaymentStatus.PAID || status === PaymentStatus.DEPOSITED
              ? new Date()
              : null,
        },
      }),
      this.prisma.booking.update({
        where: { id: bookingId },
        data: {
          status:
            status === PaymentStatus.PAID || status === PaymentStatus.DEPOSITED
              ? 'CONFIRMED'
              : 'PENDING',
        },
      }),
      // Ghi nhận doanh thu nếu đã thanh toán
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
}
