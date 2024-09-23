import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import * as FormData from 'form-data';
import Mailgun, {
  MailgunClientOptions,
  MailgunMessageData,
  MessagesSendResult,
  DomainEvent,
} from 'mailgun.js';
import * as path from 'path';
import * as fs from 'node:fs/promises';
import * as mime from 'mime-types';
import { CreateNotificationAttachmentDto } from 'src/modules/notifications/dtos/create-notification-attachment.dto';
import { ProvidersService } from '../providers.service';
import { Stream } from 'stream';

@Injectable()
export class MailgunService {
  private mailgun: Mailgun;
  private mailgunClient: ReturnType<Mailgun['client']>;
  private mailgunDomain: string;

  constructor(
    private readonly providersService: ProvidersService,
    private logger: Logger,
  ) {
    this.mailgun = new Mailgun(FormData);
  }

  async assignClient(providerId: number): Promise<void> {
    this.logger.debug('Started assigning Mailgun email client');
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
    try {
      await this.assignClient(providerId);
      this.logger.debug('Sending Mailgun email');
      return this.mailgunClient.messages.create(this.mailgunDomain, mailgunNotificationData);
    } catch (error) {
      throw new Error(`Failed to send message: ${error.message}`);
    }
  }

  async formatNotificationData(
    notificationData: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    this.logger.debug('Formatting notification data for Mailgun');

    if (notificationData.attachments) {
      const formattedNotificationData = { ...notificationData };

      formattedNotificationData.attachment = await this.formatAttachments(
        notificationData.attachments as CreateNotificationAttachmentDto[],
      );
      delete formattedNotificationData.attachments;

      return formattedNotificationData;
    }

    return notificationData;
  }

  private async formatAttachments(
    attachments: CreateNotificationAttachmentDto[],
  ): Promise<{ filename: string; data: Buffer; contentType: string }[]> {
    this.logger.debug('Formatting attachments for Mailgun');
    return Promise.all(
      attachments.map(async (attachment) => {
        let data: Buffer | string | Stream = attachment.content;

        if (attachment.path) {
          try {
            const filepath = path.resolve(attachment.path);
            data = await fs.readFile(filepath);
          } catch (error) {
            throw new BadRequestException(
              `Failed to read file at path: ${attachment.path}: ${error.message}`,
            );
          }
        }

        const contentType = mime.lookup(attachment.filename) || 'application/octet-stream';
        return {
          filename: attachment.filename,
          data: Buffer.isBuffer(data) ? data : Buffer.from(data as string, 'base64'),
          contentType,
        };
      }),
    );
  }

  async getDeliveryStatus(messageId: string, providerId: number): Promise<DomainEvent> {
    try {
      this.logger.debug('Fetching delivery status from Mailgun email');
      await this.assignClient(providerId);

      // Remove angle brackets from messageId
      const sanitizedMessageId = messageId.replace(/[<>]/g, '');
      const response = await this.mailgunClient.events.get(this.mailgunDomain, {
        'message-id': sanitizedMessageId,
      });
      this.logger.debug(`Mailgun email Delivery status: ${response}`);
      return response.items[0];
    } catch (error) {
      throw new Error(`Failed to fetch delivery status: ${error.message}`);
    }
  }
}
