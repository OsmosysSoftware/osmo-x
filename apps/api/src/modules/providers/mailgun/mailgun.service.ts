import { Injectable } from '@nestjs/common';
import * as FormData from 'form-data';
import Mailgun, { MailgunClientOptions, MailgunMessageData, MessagesSendResult } from 'mailgun.js';
import * as path from 'path';
import * as fs from 'node:fs/promises';
import { CreateNotificationAttachmentDto } from 'src/modules/notifications/dtos/create-notification-attachment.dto';
import { ProvidersService } from '../providers.service';

@Injectable()
export class MailgunService {
  private mailgun: Mailgun = new Mailgun(FormData);
  private mailgunClient;
  private mailgunDomain: string;

  constructor(private readonly providersService: ProvidersService) {}

  async assignClient(providerId: number): Promise<void> {
    const mailgunConfig = await this.providersService.getConfigById(providerId);
    this.mailgunClient = this.mailgun.client({
      username: 'api',
      key: mailgunConfig.MAILGUN_API_KEY as string,
      url: `https://${mailgunConfig.MAILGUN_HOST as string}`,
    } as MailgunClientOptions);
    this.mailgunDomain = mailgunConfig.MAILGUN_DOMAIN as string;
  }

  async sendEmail(
    mailgunNotificationData: MailgunMessageData,
    providerId: number,
  ): Promise<MessagesSendResult> {
    await this.assignClient(providerId);
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
