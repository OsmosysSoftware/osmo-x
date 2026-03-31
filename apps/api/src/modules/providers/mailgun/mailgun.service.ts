import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import * as FormData from 'form-data';
import Mailgun, {
  MailgunClientOptions,
  MailgunMessageData,
  MessagesSendResult,
  EventsList,
} from 'mailgun.js';
import * as path from 'path';
import * as fsPromise from 'node:fs/promises';
import * as fs from 'fs';
import * as mime from 'mime-types';
import { CreateNotificationAttachmentDto } from 'src/modules/notifications/dtos/create-notification-attachment.dto';
import { CreateNotificationIcalEventDto } from 'src/modules/notifications/dtos/create-notification-ical-event.dto';
import { ProvidersService } from '../providers.service';
import { Stream } from 'stream';
import { Attachment } from 'nodemailer/lib/mailer';
import MailComposer = require('nodemailer/lib/mail-composer');

@Injectable()
export class MailgunService {
  private mailgun: Mailgun;
  private mailgunClient: ReturnType<Mailgun['client']>;
  private mailgunDomain: string;

  constructor(
    private readonly providersService: ProvidersService,
    private logger: Logger = new Logger(MailgunService.name),
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

    const icalEvent =
      (notificationData.icalEvent as CreateNotificationIcalEventDto | undefined) ??
      (notificationData.ical_event as CreateNotificationIcalEventDto | undefined);

    if (icalEvent) {
      return this.formatMimeNotificationData(notificationData, icalEvent);
    }

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

  private async formatMimeNotificationData(
    notificationData: Record<string, unknown>,
    icalEvent: CreateNotificationIcalEventDto,
  ): Promise<Record<string, unknown>> {
    const attachments = notificationData.attachments as
      | CreateNotificationAttachmentDto[]
      | undefined;
    const calendarEventContent = await this.getIcalEventContent(icalEvent);
    const formattedAttachments = attachments
      ? await this.formatMimeAttachments(attachments)
      : undefined;

    const composer = new MailComposer({
      from: notificationData.from as string,
      to: notificationData.to as string | string[],
      cc: notificationData.cc as string | string[] | undefined,
      bcc: notificationData.bcc as string | string[] | undefined,
      subject: notificationData.subject as string,
      text: notificationData.text as string | undefined,
      html: notificationData.html as string | undefined,
      attachments: formattedAttachments,
      icalEvent: {
        method: icalEvent.method ?? 'REQUEST',
        filename: icalEvent.filename ?? 'invite.ics',
        content: calendarEventContent,
      },
    });

    const message = await composer.compile().build();

    return {
      to: notificationData.to as string | string[],
      message,
    };
  }

  private async getIcalEventContent(icalEvent: CreateNotificationIcalEventDto): Promise<string> {
    if (icalEvent.content) {
      if (Buffer.isBuffer(icalEvent.content)) {
        return icalEvent.content.toString('utf-8');
      }

      return icalEvent.content;
    }

    if (icalEvent.path) {
      try {
        if (!fs.existsSync(icalEvent.path)) {
          throw new BadRequestException(`iCal file not found at path: ${icalEvent.path}`);
        }
        const filepath = path.resolve(icalEvent.path);
        const data = await fsPromise.readFile(filepath);
        return data.toString('utf-8');
      } catch (error) {
        throw new BadRequestException(
          `Failed to read iCal file at path: ${icalEvent.path}: ${error.message}`,
        );
      }
    }

    throw new BadRequestException('Content or path must be provided for icalEvent');
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
            data = await fsPromise.readFile(filepath);
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

  private async formatMimeAttachments(
    attachments: CreateNotificationAttachmentDto[],
  ): Promise<Attachment[]> {
    const formattedAttachments = await this.formatAttachments(attachments);

    return formattedAttachments.map((attachment) => ({
      filename: attachment.filename,
      content: attachment.data,
      contentType: attachment.contentType,
    }));
  }

  async getDeliveryStatus(messageId: string, providerId: number): Promise<EventsList> {
    try {
      this.logger.debug('Fetching delivery status from Mailgun email');
      await this.assignClient(providerId);

      // Remove angle brackets from messageId
      const sanitizedMessageId = messageId.replace(/[<>]/g, '');
      const response = await this.mailgunClient.events.get(this.mailgunDomain, {
        'message-id': sanitizedMessageId,
      });
      this.logger.debug(`Mailgun email Delivery status: ${JSON.stringify(response)}`);
      return response;
    } catch (error) {
      throw new Error(`Failed to fetch delivery status: ${error.message}`);
    }
  }
}
