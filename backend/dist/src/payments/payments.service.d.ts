import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentMethod, PaymentStatus } from '@prisma/client';
export declare class PaymentsService {
    private configService;
    private prisma;
    private payos;
    private readonly logger;
    constructor(configService: ConfigService, prisma: PrismaService);
    private asString;
    verifyMomoSignature(body: Record<string, unknown>): boolean;
    handlePayosWebhook(body: Record<string, unknown>): Promise<void>;
    createPaymentUrl(bookingId: string, amount: number, method: PaymentMethod): Promise<{
        paymentUrl: string;
        transactionId: string;
    }>;
    verifyPayment(bookingId: string, transactionId: string, status: PaymentStatus): Promise<boolean>;
}
