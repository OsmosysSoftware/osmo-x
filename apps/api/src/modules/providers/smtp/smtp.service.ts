import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
// import { ProvidersService } from '../providers.service';
// import { ChannelType } from 'src/common/constants/notifications';

@Injectable()
export class SmtpService {
  private transporter: nodemailer.Transporter;
  private configService: ConfigService = new ConfigService();

  constructor() {
    // this.transporter = this.assignTransport();
    this.transporter = nodemailer.createTransport({
      host: this.configService.getOrThrow<string>('SMTP_HOST'),
      port: this.configService.getOrThrow<number>('SMTP_PORT'),
      auth: {
        user: this.configService.getOrThrow<string>('SMTP_USERNAME'),
        pass: this.configService.getOrThrow<string>('SMTP_PASSWORD'),
      },
    });
  }

  // assignTransport() {
  //   const hostValue = this.assignValue('SMTP_HOST');
  //   return nodemailer.createTransport({
  //     host: hostValue,
  //     port: this.configService.getOrThrow<number>('SMTP_PORT'),
  //     auth: {
  //       user: this.configService.getOrThrow<string>('SMTP_USERNAME'),
  //       pass: this.configService.getOrThrow<string>('SMTP_PASSWORD'),
  //     },
  //   });
  // }

  // assignValue(smtpKey: string): string {
  //   return this.getSmtpValue(smtpKey);
  // }

  // async getSmtpValue(smtpKey: string): Promise<string> {
  //   const smtpConfig = await this.providersService.getConfigById(ChannelType.SMTP);

  //   if (smtpKey === 'SMTP_HOST') {
  //     return smtpConfig.SMTP_HOST as string;
  //   }

  //   return null;
  // }

  sendEmail(smtpNotificationData: nodemailer.SendMailOptions): Promise<string> {
    return this.transporter.sendMail(smtpNotificationData);
  }
}
