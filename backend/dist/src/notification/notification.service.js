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
var NotificationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_ses_1 = require("@aws-sdk/client-ses");
const client_sns_1 = require("@aws-sdk/client-sns");
let NotificationService = NotificationService_1 = class NotificationService {
    configService;
    sesClient = null;
    snsClient = null;
    senderEmail;
    logger = new common_1.Logger(NotificationService_1.name);
    constructor(configService) {
        this.configService = configService;
        this.senderEmail =
            this.configService.get('AWS_SES_EMAIL_SENDER') ||
                'noreply@datxe.linuxunity.com';
        const accessKeyId = this.configService.get('AWS_ACCESS_KEY_ID');
        const secretAccessKey = this.configService.get('AWS_SECRET_ACCESS_KEY');
        const region = this.configService.get('AWS_REGION') || 'us-east-1';
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
            this.logger.warn('AWS Credentials missing. Notification Service will run in MOCK mode (logging to console).');
        }
    }
    async sendEmail(to, subject, body) {
        this.logger.log(`Sending email to ${to} with subject "${subject}"...`);
        if (this.sesClient) {
            try {
                const command = new client_ses_1.SendEmailCommand({
                    Source: this.senderEmail,
                    Destination: { ToAddresses: [to] },
                    Message: {
                        Subject: { Data: subject },
                        Body: { Html: { Data: body } },
                    },
                });
                await this.sesClient.send(command);
                this.logger.log(`Email successfully sent to ${to}`);
            }
            catch (error) {
                this.logger.error(`Error sending email to ${to} via AWS SES: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
        else {
            this.logger.log(`[MOCK EMAIL SENT] To: ${to}\nSubject: ${subject}\nBody:\n${body}\n----------------------`);
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
            this.logger.log(`[MOCK EMAIL SENT WITH ATTACHMENT] To: ${to}\nSubject: ${subject}\nFilename: ${filename}\nBody:\n${body}\n----------------------`);
        }
    }
    async sendSMS(phoneNumber, message) {
        this.logger.log(`Sending SMS to ${phoneNumber}: "${message}"...`);
        if (this.snsClient) {
            try {
                const command = new client_sns_1.PublishCommand({
                    PhoneNumber: phoneNumber,
                    Message: message,
                });
                await this.snsClient.send(command);
                this.logger.log(`SMS successfully sent to ${phoneNumber}`);
            }
            catch (error) {
                this.logger.error(`Error sending SMS to ${phoneNumber} via AWS SNS: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
        else {
            this.logger.log(`[MOCK SMS SENT] To: ${phoneNumber}\nMessage: ${message}\n----------------------`);
        }
    }
};
exports.NotificationService = NotificationService;
exports.NotificationService = NotificationService = NotificationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], NotificationService);
//# sourceMappingURL=notification.service.js.map