"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var NotificationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_ses_1 = require("@aws-sdk/client-ses");
const client_sns_1 = require("@aws-sdk/client-sns");
const nodemailer = __importStar(require("nodemailer"));
const prisma_service_1 = require("../prisma/prisma.service");
let NotificationService = NotificationService_1 = class NotificationService {
    configService;
    prisma;
    sesClient = null;
    snsClient = null;
    senderEmail;
    smtp = null;
    logger = new common_1.Logger(NotificationService_1.name);
    smsEnabled;
    smsProvider;
    smsSenderId;
    smsConfigurationError;
    constructor(configService, prisma) {
        this.configService = configService;
        this.prisma = prisma;
        this.senderEmail =
            this.configService.get('AWS_SES_EMAIL_SENDER') ||
                'noreply@datxe.linuxunity.com';
        const accessKeyId = this.configService.get('AWS_ACCESS_KEY_ID');
        const secretAccessKey = this.configService.get('AWS_SECRET_ACCESS_KEY');
        const region = this.configService.get('AWS_REGION') || 'us-east-1';
        this.smsEnabled =
            this.configService.get('SMS_ENABLED')?.toLowerCase() === 'true';
        this.smsProvider = (this.configService.get('SMS_PROVIDER') || 'AWS_SNS')
            .trim()
            .toUpperCase();
        const senderId = this.configService.get('SMS_SENDER_ID')?.trim();
        this.smsSenderId = senderId || undefined;
        if (this.smsProvider !== 'AWS_SNS') {
            this.smsConfigurationError = `SMS_PROVIDER không được hỗ trợ: ${this.smsProvider}`;
        }
        else if (this.smsSenderId &&
            !/^[A-Za-z0-9]{1,11}$/.test(this.smsSenderId)) {
            this.smsConfigurationError =
                'SMS_SENDER_ID chỉ được gồm 1-11 ký tự chữ hoặc số';
        }
        if (accessKeyId && secretAccessKey) {
            this.sesClient = new client_ses_1.SESClient({
                region,
                credentials: { accessKeyId, secretAccessKey },
            });
            this.snsClient = new client_sns_1.SNSClient({
                region,
                credentials: { accessKeyId, secretAccessKey },
            });
            this.logger.log('AWS SES & SNS Clients initialized successfully.');
        }
        else {
            this.logger.warn('AWS credentials are missing. SES/SNS delivery is disabled.');
        }
        const smtpHost = this.configService.get('SMTP_HOST');
        if (smtpHost) {
            this.senderEmail =
                this.configService.get('SMTP_FROM') || this.senderEmail;
            this.smtp = nodemailer.createTransport({
                host: smtpHost,
                port: Number(this.configService.get('SMTP_PORT') || 587),
                secure: Number(this.configService.get('SMTP_PORT') || 587) === 465,
                auth: this.configService.get('SMTP_USER')
                    ? {
                        user: this.configService.get('SMTP_USER'),
                        pass: this.configService.get('SMTP_PASS'),
                    }
                    : undefined,
                connectionTimeout: 8000,
            });
        }
    }
    async sendEmail(to, subject, body, template = 'legacy', userId) {
        this.logger.log(`Sending email to ${to} with subject "${subject}"...`);
        try {
            if (this.smtp) {
                await this.smtp.sendMail({
                    from: this.senderEmail,
                    to,
                    subject,
                    html: body,
                });
            }
            else if (this.sesClient) {
                const command = new client_ses_1.SendEmailCommand({
                    Source: this.senderEmail,
                    Destination: { ToAddresses: [to] },
                    Message: {
                        Subject: { Data: subject },
                        Body: { Html: { Data: body } },
                    },
                });
                await this.sesClient.send(command);
            }
            else {
                throw new Error('SMTP/SES chưa được cấu hình');
            }
            await this.logDelivery(to, template, 'SENT', undefined, userId);
            this.logger.log(`Email successfully sent to ${to}`);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.logger.warn(`Email to ${to} was not sent: ${message}`);
            await this.logDelivery(to, template, 'FAILED', message, userId);
        }
    }
    async logDelivery(recipient, template, status, errorMessage, userId) {
        try {
            await this.prisma.notificationLog.create({
                data: {
                    channel: 'EMAIL',
                    recipient,
                    template,
                    status,
                    errorMessage,
                    userId,
                },
            });
        }
        catch (error) {
            this.logger.warn(`Could not persist notification log: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async sendEmailWithAttachment(to, subject, body, attachmentBase64, filename) {
        this.logger.log(`Sending email to ${to} with attachment "${filename}"...`);
        if (this.sesClient) {
            try {
                const boundary = `----=_Part_${Date.now()}`;
                const rawMessage = [
                    `From: ${this.senderEmail}`,
                    `To: ${to}`,
                    `Subject: ${subject}`,
                    `MIME-Version: 1.0`,
                    `Content-Type: multipart/mixed; boundary="${boundary}"`,
                    ``,
                    `--${boundary}`,
                    `Content-Type: text/html; charset=UTF-8`,
                    `Content-Transfer-Encoding: 7bit`,
                    ``,
                    body,
                    ``,
                    `--${boundary}`,
                    `Content-Type: application/pdf; name="${filename}"`,
                    `Content-Transfer-Encoding: base64`,
                    `Content-Disposition: attachment; filename="${filename}"`,
                    ``,
                    attachmentBase64,
                    ``,
                    `--${boundary}--`,
                ].join('\r\n');
                const command = new client_ses_1.SendRawEmailCommand({
                    RawMessage: {
                        Data: Buffer.from(rawMessage),
                    },
                });
                await this.sesClient.send(command);
                this.logger.log(`Email with attachment successfully sent to ${to}`);
            }
            catch (error) {
                this.logger.error(`Error sending email with attachment to ${to} via AWS SES: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
        else {
            this.logger.warn(`Email attachment "${filename}" was not sent because AWS SES is not configured.`);
        }
    }
    async sendSMS(phoneNumber, message, template = 'legacy-sms', userId, idempotencyKey, required = false) {
        if (idempotencyKey) {
            const delivered = await this.prisma.notificationLog.findUnique({
                where: { idempotencyKey },
            });
            if (delivered?.status === 'SENT')
                return true;
        }
        this.logger.log(`Sending SMS template ${template} to ${phoneNumber}...`);
        if (this.snsClient && this.smsEnabled && !this.smsConfigurationError) {
            try {
                const messageAttributes = {
                    'AWS.SNS.SMS.SMSType': {
                        DataType: 'String',
                        StringValue: 'Transactional',
                    },
                    ...(this.smsSenderId
                        ? {
                            'AWS.SNS.SMS.SenderID': {
                                DataType: 'String',
                                StringValue: this.smsSenderId,
                            },
                        }
                        : {}),
                };
                const command = new client_sns_1.PublishCommand({
                    PhoneNumber: phoneNumber,
                    Message: message,
                    MessageAttributes: messageAttributes,
                });
                const result = await this.snsClient.send(command);
                await this.logSmsDelivery({
                    phoneNumber,
                    template,
                    status: 'SENT',
                    userId,
                    idempotencyKey,
                    providerMessageId: result.MessageId,
                });
                this.logger.log(`SMS successfully sent to ${phoneNumber}`);
                return true;
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                this.logger.error(`Error sending SMS to ${phoneNumber} via AWS SNS: ${errorMessage}`);
                await this.logSmsDelivery({
                    phoneNumber,
                    template,
                    status: 'FAILED',
                    userId,
                    idempotencyKey,
                    errorMessage,
                });
                if (required)
                    throw error;
                return false;
            }
        }
        const errorMessage = this.smsConfigurationError ||
            (this.smsEnabled
                ? 'AWS SNS chưa được cấu hình'
                : 'Gửi SMS chưa được bật');
        await this.logSmsDelivery({
            phoneNumber,
            template,
            status: 'FAILED',
            userId,
            idempotencyKey,
            errorMessage,
        });
        if (required)
            throw new Error(errorMessage);
        this.logger.warn(`SMS to ${phoneNumber} was not sent: ${errorMessage}`);
        return false;
    }
    async logSmsDelivery(input) {
        try {
            if (!input.idempotencyKey) {
                await this.prisma.notificationLog.create({
                    data: {
                        channel: 'SMS',
                        recipient: input.phoneNumber,
                        template: input.template,
                        status: input.status,
                        userId: input.userId,
                        providerMessageId: input.providerMessageId,
                        errorMessage: input.errorMessage,
                    },
                });
                return;
            }
            await this.prisma.notificationLog.upsert({
                where: { idempotencyKey: input.idempotencyKey },
                create: {
                    channel: 'SMS',
                    recipient: input.phoneNumber,
                    template: input.template,
                    status: input.status,
                    userId: input.userId,
                    idempotencyKey: input.idempotencyKey,
                    providerMessageId: input.providerMessageId,
                    errorMessage: input.errorMessage,
                },
                update: {
                    status: input.status,
                    providerMessageId: input.providerMessageId,
                    errorMessage: input.errorMessage,
                    attemptCount: { increment: 1 },
                    lastAttemptAt: new Date(),
                },
            });
        }
        catch (error) {
            this.logger.warn(`Could not persist SMS log: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async createInAppNotification(userId, title, content, link) {
        try {
            return await this.prisma.notification.create({
                data: {
                    userId,
                    title,
                    content,
                    link,
                },
            });
        }
        catch (error) {
            this.logger.warn(`Could not create in-app notification for user ${userId}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async getUserNotifications(userId) {
        return this.prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 20,
        });
    }
    async markNotificationAsRead(id, userId) {
        return this.prisma.notification.updateMany({
            where: { id, userId },
            data: { isRead: true },
        });
    }
};
exports.NotificationService = NotificationService;
exports.NotificationService = NotificationService = NotificationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService])
], NotificationService);
//# sourceMappingURL=notification.service.js.map