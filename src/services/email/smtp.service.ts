import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { SmtpNotificationData } from 'src/common/types/SmtpNotificationData';

@Injectable()
export class SmtpService {
  private transporter: nodemailer.Transporter;
  private configService: ConfigService = new ConfigService();

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: this.configService.getOrThrow<string>('SMTP_HOST'),
      port: this.configService.getOrThrow<number>('SMTP_PORT'),
      auth: {
        user: this.configService.getOrThrow<string>('SMTP_USERNAME'),
        pass: this.configService.getOrThrow<string>('SMTP_PASSWORD'),
      },
    });
  }

  async sendEmail(smtpNotificationData: SmtpNotificationData): Promise<void> {
    this.transporter.sendMail(smtpNotificationData);
  }
}
