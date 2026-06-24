import { ConfigService } from '@nestjs/config';
export declare class NotificationService {
    private configService;
    private sesClient;
    private snsClient;
    private senderEmail;
    private readonly logger;
    constructor(configService: ConfigService);
    sendEmail(to: string, subject: string, body: string): Promise<void>;
    sendEmailWithAttachment(to: string, subject: string, body: string, attachmentBase64: string, filename: string): Promise<void>;
    sendSMS(phoneNumber: string, message: string): Promise<void>;
}
