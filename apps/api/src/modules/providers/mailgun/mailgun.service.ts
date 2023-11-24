import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as FormData from 'form-data';
import Mailgun, { MailgunClientOptions, MailgunMessageData, MessagesSendResult } from 'mailgun.js';

@Injectable()
export class MailgunService {
  private configService: ConfigService = new ConfigService();
  private mailgun: Mailgun = new Mailgun(FormData);
  private mailgunClient;
  private mailgunDomain: string;

  constructor() {
    this.mailgunClient = this.mailgun.client({
      username: 'api',
      key: this.configService.getOrThrow<string>('MAILGUN_API_KEY'),
      host: this.configService.getOrThrow<string>('MAILGUN_HOST'),
    } as MailgunClientOptions);
    this.mailgunDomain = this.configService.getOrThrow<string>('MAILGUN_DOMAIN');
  }

  sendEmail(mailgunNotificationData: MailgunMessageData): Promise<MessagesSendResult> {
    return this.mailgunClient.messages.create(this.mailgunDomain, mailgunNotificationData);
  }
}
