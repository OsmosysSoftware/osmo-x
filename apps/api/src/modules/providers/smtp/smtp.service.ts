import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ProvidersService } from '../providers.service';

@Injectable()
export class SmtpService {
  private transporter: nodemailer.Transporter;

  constructor(private readonly providersService: ProvidersService) {}

  async assignTransport(providerId: number): Promise<void> {
    const smtpConfig = await this.providersService.getConfigById(providerId);
    this.transporter = nodemailer.createTransport({
      host: smtpConfig.SMTP_HOST as string,
      port: smtpConfig.SMTP_PORT as number,
      auth: {
        user: smtpConfig.SMTP_USERNAME as string,
        pass: smtpConfig.SMTP_PASSWORD as string,
      },
    });
  }

  async sendEmail(
    smtpNotificationData: nodemailer.SendMailOptions,
    providerId: number,
  ): Promise<string> {
    await this.assignTransport(providerId);
    return this.transporter.sendMail(smtpNotificationData);
  }
}
