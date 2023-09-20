import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as FormData from 'form-data';
import Mailgun, { MailgunClientOptions, MailgunMessageData, MessagesSendResult } from 'mailgun.js';
import { CreateNotificationAttachmentDto } from 'src/modules/notifications/dtos/create-notification-attachment.dto';
import { CreateNotificationDataDto } from 'src/modules/notifications/dtos/create-notification-data.dto';

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

  formatNotificationData(notificationData: CreateNotificationDataDto): unknown {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formattedNotificationData: any = notificationData;
    formattedNotificationData.attachment = this.formatAttachments(notificationData.attachments);
    delete formattedNotificationData.attachments;
    return formattedNotificationData;
  }

  formatAttachments(attachments: CreateNotificationAttachmentDto[]): unknown[] {
    const formattedAttachments = [];

    for (const attachment of attachments) {
      formattedAttachments.push({
        filename: attachment.filename,
        data: attachment.content,
      });
    }

    return formattedAttachments;
  }
}
