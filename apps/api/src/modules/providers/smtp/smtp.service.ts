import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ProvidersService } from '../providers.service';
import { ChannelType } from 'src/common/constants/notifications';

@Injectable()
export class SmtpService {
  private transporter: nodemailer.Transporter;

  constructor(private readonly providersService: ProvidersService) {}

  async onModuleInit(): Promise<void> {
    await this.assignTransport();
  }

  async assignTransport(): Promise<void> {
    const smtpConfig = await this.providersService.getConfigById(ChannelType.SMTP);
    this.transporter = nodemailer.createTransport({
      host: smtpConfig.SMTP_HOST as string,
      port: smtpConfig.SMTP_PORT as number,
      auth: {
        user: smtpConfig.SMTP_USERNAME as string,
        pass: smtpConfig.SMTP_PASSWORD as string,
      },
    });
  }

  sendEmail(smtpNotificationData: nodemailer.SendMailOptions): Promise<string> {
    return this.transporter.sendMail(smtpNotificationData);
  }
}
