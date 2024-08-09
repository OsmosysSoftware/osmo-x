import { Injectable, Logger } from '@nestjs/common';
import { SendEmailCommandOutput, SESClient } from '@aws-sdk/client-ses';
import { SendEmailCommand } from '@aws-sdk/client-ses';
import { ProvidersService } from '../providers.service';

export interface AwsSesData {
  from: string;
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  text?: string;
  html?: string;
  replyToAddresses?: string;
}

@Injectable()
export class AwsSesService {
  private awsSesClient: SESClient;

  constructor(
    private readonly providersService: ProvidersService,
    private logger: Logger,
  ) {}

  async assignAwsSesConfig(providerId: number): Promise<void> {
    this.logger.debug('Started assigning AWS SES email client');
    const awsSesConfig = await this.providersService.getConfigById(providerId);

    this.awsSesClient = new SESClient({
      credentials: {
        accessKeyId: awsSesConfig.AWS_ACCESS_KEY_ID as string,
        secretAccessKey: awsSesConfig.AWS_SECRET_ACCESS_KEY as string,
      },
      region: awsSesConfig.AWS_REGION as string,
    });
  }

  async sendPushNotification(
    data: AwsSesData,
    providerId: number,
  ): Promise<SendEmailCommandOutput> {
    await this.assignAwsSesConfig(providerId);

    // Prepare AWS SES publish parameters
    const sendEmailCommandParams = new SendEmailCommand({
      Destination: {
        BccAddresses: [data.bcc],
        CcAddresses: [data.cc],
        ToAddresses: [data.to],
      },
      Message: {
        Body: {
          Html: {
            Charset: 'UTF-8',
            Data: data.html,
          },
          Text: {
            Charset: 'UTF-8',
            Data: data.text,
          },
        },
        Subject: {
          Charset: 'UTF-8',
          Data: data.subject,
        },
      },
      Source: data.from,
      ReplyToAddresses: [data.replyToAddresses],
    });

    this.logger.debug('Sending AWS SES email');

    try {
      return await this.awsSesClient.send(sendEmailCommandParams);
    } catch (error) {
      if (error instanceof Error && error.name === 'MessageRejected') {
        /** @type { import('@aws-sdk/client-ses').MessageRejected} */
        const messageRejectedError = error;
        throw messageRejectedError;
      }

      throw new Error(`Failed to send message: ${error.message}`);
    }
  }
}
