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
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
  attachment?: Attachment[] | undefined;
}

@Injectable()
export class AwsSesService {
  constructor(
    private readonly providersService: ProvidersService,
    private logger: Logger,
  ) {}

  async sendAwsSes(
    formattedData: AwsSesData,
    providerId: number,
  ): Promise<SESTransport.SentMessageInfo> {
    try {
      this.logger.debug('Started assigning AWS SES email client');
      const awsSesConfig = await this.providersService.getConfigById(providerId);

      const ses = new aws.SES({
        apiVersion: '2010-12-01',
        region: awsSesConfig.AWS_REGION as string,
        credentials: {
          accessKeyId: awsSesConfig.AWS_ACCESS_KEY_ID as string,
          secretAccessKey: awsSesConfig.AWS_SECRET_ACCESS_KEY as string,
        },
      });

      // create Nodemailer SES transporter
      const transporter = nodemailer.createTransport({
        SES: { ses, aws },
      });

      // Prepare mail option parameters
      const mailOptions = {
        from: formattedData.from,
        to: formattedData.to.split(','),
        subject: formattedData.subject,
        text: formattedData.text,
        html: formattedData.html,
        cc: formattedData.cc?.split(',') || [],
        bcc: formattedData.bcc?.split(',') || [],
        replyTo: formattedData.replyTo?.split(',') || [],
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

  async formatNotificationData(
    notificationData: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    this.logger.debug('Formatting notification data for AWS SES');

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
    this.logger.debug('Formatting attachments for AWS SES');
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
}
