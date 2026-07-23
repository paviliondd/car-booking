import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  SESClient,
  SendEmailCommand,
  SendRawEmailCommand,
} from '@aws-sdk/client-ses';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationService {
  private sesClient: SESClient | null = null;
  private snsClient: SNSClient | null = null;
  private senderEmail: string;
  private smtp: nodemailer.Transporter | null = null;
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.senderEmail =
      this.configService.get<string>('AWS_SES_EMAIL_SENDER') ||
      'noreply@datxe.linuxunity.com';
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>(
      'AWS_SECRET_ACCESS_KEY',
    );
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
      this.logger.warn(
        'AWS Credentials missing. Notification Service will run in MOCK mode (logging to console).',
      );
    }
    const smtpHost = this.configService.get<string>('SMTP_HOST');
    if (smtpHost) {
      this.senderEmail =
        this.configService.get<string>('SMTP_FROM') || this.senderEmail;
      this.smtp = nodemailer.createTransport({
        host: smtpHost,
        port: Number(this.configService.get<string>('SMTP_PORT') || 587),
        secure:
          Number(this.configService.get<string>('SMTP_PORT') || 587) === 465,
        auth: this.configService.get<string>('SMTP_USER')
          ? {
              user: this.configService.get<string>('SMTP_USER'),
              pass: this.configService.get<string>('SMTP_PASS'),
            }
          : undefined,
        connectionTimeout: 8000,
      });
    }
  }

  async sendEmail(
    to: string,
    subject: string,
    body: string,
    template = 'legacy',
    userId?: string,
  ): Promise<void> {
    this.logger.log(`Sending email to ${to} with subject "${subject}"...`);
    try {
      if (this.smtp) {
        await this.smtp.sendMail({
          from: this.senderEmail,
          to,
          subject,
          html: body,
        });
      } else if (this.sesClient) {
        const command = new SendEmailCommand({
          Source: this.senderEmail,
          Destination: { ToAddresses: [to] },
          Message: {
            Subject: { Data: subject },
            Body: { Html: { Data: body } },
          },
        });
        await this.sesClient.send(command);
      } else {
        throw new Error('SMTP/SES chưa được cấu hình');
      }
      await this.logDelivery(to, template, 'SENT', undefined, userId);
      this.logger.log(`Email successfully sent to ${to}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Email to ${to} was not sent: ${message}`);
      await this.logDelivery(to, template, 'FAILED', message, userId);
    }
  }

  private async logDelivery(
    recipient: string,
    template: string,
    status: string,
    errorMessage?: string,
    userId?: string,
  ) {
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
    } catch (error) {
      this.logger.warn(
        `Could not persist notification log: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async sendEmailWithAttachment(
    to: string,
    subject: string,
    body: string,
    attachmentBase64: string,
    filename: string,
  ): Promise<void> {
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

        const command = new SendRawEmailCommand({
          RawMessage: {
            Data: Buffer.from(rawMessage),
          },
        });
        await this.sesClient.send(command);
        this.logger.log(`Email with attachment successfully sent to ${to}`);
      } catch (error) {
        this.logger.error(
          `Error sending email with attachment to ${to} via AWS SES: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    } else {
      this.logger.log(
        `[MOCK EMAIL SENT WITH ATTACHMENT] To: ${to}\nSubject: ${subject}\nFilename: ${filename}\nBody:\n${body}\n----------------------`,
      );
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
        this.logger.error(
          `Error sending SMS to ${phoneNumber} via AWS SNS: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    } else {
      this.logger.log(
        `[MOCK SMS SENT] To: ${phoneNumber}\nMessage: ${message}\n----------------------`,
      );
    }
  }
}
