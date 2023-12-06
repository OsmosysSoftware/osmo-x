import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as FormData from 'form-data';
import Mailgun, { MailgunClientOptions, MailgunMessageData, MessagesSendResult } from 'mailgun.js';
import * as path from 'path';
import * as fs from 'node:fs/promises';
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

  async formatNotificationData(notificationData: Record<string, unknown>): Promise<object> {
    if (notificationData.attachments) {
      const formattedNotificationData = notificationData;

      formattedNotificationData.attachment = await this.formatAttachments(
        notificationData.attachments as CreateNotificationAttachmentDto[],
      );
      delete formattedNotificationData.attachments;

      return formattedNotificationData;
    }

    return notificationData;
  }

  async formatAttachments(attachments: CreateNotificationAttachmentDto[]): Promise<object[]> {
    const formattedAttachments = [];

    for (const attachment of attachments) {
      let data = attachment.content;

      if (attachment.path) {
        const filepath = path.resolve(attachment.path);
        data = await fs.readFile(filepath);
      }

      formattedAttachments.push({
        filename: attachment.filename,
        data,
      });
    }

    return formattedAttachments;
  }
}
