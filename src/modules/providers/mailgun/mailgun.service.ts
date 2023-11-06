import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as FormData from 'form-data';
import Mailgun, { MailgunClientOptions, MailgunMessageData, MessagesSendResult } from 'mailgun.js';
import { CreateNotificationAttachmentDto } from 'src/modules/notifications/dtos/create-notification-attachment.dto';

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

  formatNotificationData(notificationData: Record<string, unknown>): object {
    const formattedNotificationData = notificationData;
    formattedNotificationData.attachment = this.formatAttachments(
      notificationData.attachments as CreateNotificationAttachmentDto[],
    );
    delete formattedNotificationData.attachments;
    return formattedNotificationData;
  }

  formatAttachments(attachments: CreateNotificationAttachmentDto[]): object[] {
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
