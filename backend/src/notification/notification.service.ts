import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

@Injectable()
export class NotificationService {
  private sesClient: SESClient | null = null;
  private snsClient: SNSClient | null = null;
  private senderEmail: string;
  private readonly logger = new Logger(NotificationService.name);

  constructor(private configService: ConfigService) {
    this.senderEmail = this.configService.get<string>('AWS_SES_EMAIL_SENDER') || 'noreply@datxe.linuxunity.com';
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');
    const region = this.configService.get<string>('AWS_REGION') || 'us-east-1';

    if (accessKeyId && secretAccessKey) {
      this.sesClient = new SESClient({
        region,
        credentials: { accessKeyId, secretAccessKey },
      });
      this.snsClient = new SNSClient({
        region,
        credentials: { accessKeyId, secretAccessKey },
      });
      this.logger.log('AWS SES & SNS Clients initialized successfully.');
    } else {
      this.logger.warn('AWS Credentials missing. Notification Service will run in MOCK mode (logging to console).');
    }
  }

  async sendEmail(to: string, subject: string, body: string): Promise<void> {
    this.logger.log(`Sending email to ${to} with subject "${subject}"...`);
    if (this.sesClient) {
      try {
        const command = new SendEmailCommand({
          Source: this.senderEmail,
          Destination: { ToAddresses: [to] },
          Message: {
            Subject: { Data: subject },
            Body: { Html: { Data: body } },
          },
        });
        await this.sesClient.send(command);
        this.logger.log(`Email successfully sent to ${to}`);
      } catch (error) {
        this.logger.error(`Error sending email to ${to} via AWS SES`, error);
      }
    } else {
      this.logger.log(`[MOCK EMAIL SENT] To: ${to}\nSubject: ${subject}\nBody:\n${body}\n----------------------`);
    }
  }

  async sendSMS(phoneNumber: string, message: string): Promise<void> {
    this.logger.log(`Sending SMS to ${phoneNumber}: "${message}"...`);
    if (this.snsClient) {
      try {
        const command = new PublishCommand({
          PhoneNumber: phoneNumber,
          Message: message,
        });
        await this.snsClient.send(command);
        this.logger.log(`SMS successfully sent to ${phoneNumber}`);
      } catch (error) {
        this.logger.error(`Error sending SMS to ${phoneNumber} via AWS SNS`, error);
      }
    } else {
      this.logger.log(`[MOCK SMS SENT] To: ${phoneNumber}\nMessage: ${message}\n----------------------`);
    }
  }
}
