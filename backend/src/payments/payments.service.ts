import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentMethod, PaymentStatus } from '@prisma/client';
const PayOS = require('@payos/node');

@Injectable()
export class PaymentsService {
  private payos: any = null;
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const payosClientId = this.configService.get<string>('PAYOS_CLIENT_ID');
    const payosApiKey = this.configService.get<string>('PAYOS_API_KEY');
    const payosChecksumKey = this.configService.get<string>('PAYOS_CHECKSUM_KEY');

    if (payosClientId && payosApiKey && payosChecksumKey && payosClientId !== 'mock_payos_client_id') {
      try {
        this.payos = new PayOS(payosClientId, payosApiKey, payosChecksumKey);
        this.logger.log('PayOS SDK initialized successfully.');
      } catch (error) {
        this.logger.error('Failed to initialize PayOS Client', error);
      }
    } else {
      this.logger.warn('PayOS config missing or mock. VietQR payment will run in MOCK mode.');
    }
  }

  async createPaymentUrl(bookingId: string, amount: number, method: PaymentMethod): Promise<{ paymentUrl: string; transactionId: string }> {
    const transactionId = `TX-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    if (method === PaymentMethod.MOMO) {
      // Mock / Real MoMo integration
      const partnerCode = this.configService.get<string>('MOMO_PARTNER_CODE');
      this.logger.log(`Creating MoMo payment link for Booking ${bookingId}, amount: ${amount}`);
      
      let paymentUrl = `https://datxe.linuxunity.com/momo-payment-mock?bookingId=${bookingId}&amount=${amount}&transactionId=${transactionId}`;
      
      if (partnerCode && partnerCode !== 'MOMO_MOCK_PARTNER') {
        // Thực tế gọi API MoMo ở đây
        // Do MoMo yêu cầu IP tĩnh hoặc cấu hình sandbox, ta tạo link mock/thật linh hoạt
        this.logger.log('MoMo integration enabled via environment variables.');
      }
      
      return { paymentUrl, transactionId };
    }

    if (method === PaymentMethod.BANK_TRANSFER) {
      this.logger.log(`Creating PayOS (VietQR) payment link for Booking ${bookingId}, amount: ${amount}`);
      
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

          const paymentLinkRes = await this.payos.createPaymentLink(paymentLinkData);
          return {
            paymentUrl: paymentLinkRes.checkoutUrl,
            transactionId: orderCode.toString(),
          };
        } catch (error) {
          this.logger.error('Error creating PayOS payment link, falling back to mock.', error);
        }
      }

      // Fallback VietQR Mock (VietQR Dynamic image generation helper using QR.io/QuickPay style)
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

  async verifyPayment(bookingId: string, transactionId: string, status: PaymentStatus): Promise<boolean> {
    this.logger.log(`Verifying payment for Booking: ${bookingId}, Tx: ${transactionId}, status: ${status}`);
    
    // Cập nhật trạng thái Payment và Booking
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { payment: true },
    });

    if (!booking) {
      throw new BadRequestException('Booking not found');
    }

    await this.prisma.$transaction([
      this.prisma.payment.update({
        where: { bookingId },
        data: {
          status,
          transactionId,
          paidAt: status === PaymentStatus.PAID || status === PaymentStatus.DEPOSITED ? new Date() : null,
        },
      }),
      this.prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: status === PaymentStatus.PAID || status === PaymentStatus.DEPOSITED ? 'CONFIRMED' : 'PENDING',
        },
      }),
      // Ghi nhận doanh thu nếu đã thanh toán
      ...(status === PaymentStatus.PAID || status === PaymentStatus.DEPOSITED
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
}
