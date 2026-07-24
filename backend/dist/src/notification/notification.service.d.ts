import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
export declare class NotificationService {
    private configService;
    private prisma;
    private sesClient;
    private snsClient;
    private senderEmail;
    private smtp;
    private readonly logger;
    private readonly smsEnabled;
    private readonly smsProvider;
    private readonly smsSenderId?;
    private readonly smsConfigurationError?;
    constructor(configService: ConfigService, prisma: PrismaService);
    sendEmail(to: string, subject: string, body: string, template?: string, userId?: string): Promise<void>;
    private logDelivery;
    sendEmailWithAttachment(to: string, subject: string, body: string, attachmentBase64: string, filename: string): Promise<void>;
    sendSMS(phoneNumber: string, message: string, template?: string, userId?: string, idempotencyKey?: string, required?: boolean): Promise<boolean>;
    private logSmsDelivery;
    createInAppNotification(userId: string, title: string, content: string, link?: string): Promise<{
        id: string;
        createdAt: Date;
        link: string | null;
        userId: string;
        title: string;
        content: string;
        isRead: boolean;
    } | undefined>;
    getUserNotifications(userId: string): Promise<{
        id: string;
        createdAt: Date;
        link: string | null;
        userId: string;
        title: string;
        content: string;
        isRead: boolean;
    }[]>;
    markNotificationAsRead(id: string, userId: string): Promise<import("@prisma/client").Prisma.BatchPayload>;
}
