import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ProvidersService } from '../providers.service';
import * as nodemailer from 'nodemailer';
import * as aws from '@aws-sdk/client-ses';
import SESTransport from 'nodemailer/lib/ses-transport';
import * as path from 'path';
import * as fs from 'node:fs/promises';
import * as mime from 'mime-types';
import { CreateNotificationAttachmentDto } from 'src/modules/notifications/dtos/create-notification-attachment.dto';
import { Stream } from 'stream';
import { Attachment } from 'nodemailer/lib/mailer';

export interface AwsSesData {
  from: string;
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string | string[];
  attachment?: Attachment[] | undefined;
}

@Injectable()
export class AwsSesService {
  constructor(
    private readonly providersService: ProvidersService,
    private logger: Logger,
  ) {}

  private async getSesClient(providerId: number): Promise<aws.SES> {
    const config = await this.providersService.getConfigById(providerId);
    return new aws.SES({
      apiVersion: '2010-12-01',
      region: config.AWS_REGION as string,
      credentials: {
        accessKeyId: config.AWS_ACCESS_KEY_ID as string,
        secretAccessKey: config.AWS_SECRET_ACCESS_KEY as string,
      },
    });
  }

  async sendAwsSes(
    formattedData: AwsSesData,
    providerId: number,
  ): Promise<SESTransport.SentMessageInfo> {
    try {
      this.logger.debug('Started assigning AWS SES email client');

      const ses = await this.getSesClient(providerId);

      // create Nodemailer SES transporter
      const transporter = nodemailer.createTransport({
        SES: { ses, aws },
        sendingRate: 1,
        maxConnections: 1,
      });

      // Prepare mail option parameters
      const mailOptions = {
        from: formattedData.from,
        to: this.normalizeEmails(formattedData.to),
        subject: formattedData.subject,
        text: formattedData.text,
        html: formattedData.html,
        cc: formattedData.cc ? this.normalizeEmails(formattedData.cc) : [],
        bcc: formattedData.bcc ? this.normalizeEmails(formattedData.bcc) : [],
        replyTo: formattedData.replyTo ? this.normalizeEmails(formattedData.replyTo) : [],
        attachments: formattedData.attachment,
      };

      this.logger.debug('Sending AWS SES email');
      const awsSesResult = await transporter.sendMail(mailOptions);

      return awsSesResult;
    } catch (error) {
      if (error instanceof Error && error.name === 'MessageRejected') {
        this.logger.error('Error sending AWS SES email: messageRejectedError', { error });
        /** @type { import('@aws-sdk/client-ses').MessageRejected} */
        const messageRejectedError = error;
        throw messageRejectedError;
      }

      throw new Error(`Failed to send message: ${error.message}`);
    }
  }

  normalizeEmails(emails: string | string[]): string[] {
    if (typeof emails === 'string') {
      // Split comma-separated values, trim each email, and filter out any empty strings
      return emails
        .split(',')
        .map((email) => email.trim())
        .filter((email) => email !== '');
    }

    // If it's already an array, return the array with each email trimmed
    return emails.map((email) => email.trim());
  }

  async formatNotificationData(
    notificationData: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    this.logger.debug('Formatting notification data for AWS SES');

    if (notificationData.attachments) {
      const formattedNotificationData = { ...notificationData };

      formattedNotificationData.attachment = await this.formatAttachments(
        notificationData.attachments as CreateNotificationAttachmentDto[],
      );
      formattedNotificationData.attachments = undefined;

      return formattedNotificationData;
    }

    return notificationData;
  }

  private async readFileContent(filepath: string): Promise<Buffer> {
    try {
      return await fs.readFile(filepath);
    } catch (error) {
      throw new BadRequestException(`Failed to read file at path: ${filepath}: ${error.message}`);
    }
  }

  private async formatAttachments(
    attachments: CreateNotificationAttachmentDto[],
  ): Promise<{ filename: string; content: Buffer | string; contentType: string }[]> {
    this.logger.debug('Formatting attachments for AWS SES');
    return Promise.all(
      attachments.map(async (attachment) => {
        let content: Buffer | string | Stream = attachment.content;

        if (attachment.path) {
          const filepath = path.resolve(attachment.path);
          content = await this.readFileContent(filepath);
        }

        const contentType = mime.lookup(attachment.filename) || 'application/octet-stream';
        return {
          filename: attachment.filename,
          content: Buffer.isBuffer(content) ? content : Buffer.from(content as string, 'utf-8'),
          contentType,
        };
      }),
    );
  }
}
