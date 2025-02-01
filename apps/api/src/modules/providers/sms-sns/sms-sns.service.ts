import { Injectable, Logger } from '@nestjs/common';
import { PublishCommandInput, PublishCommandOutput, SNS } from '@aws-sdk/client-sns';
import { ProvidersService } from '../providers.service';

export interface SmsSnsData {
  to: string;
  message: string;
}

@Injectable()
export class SmsSnsService {
  private sns: SNS;

  constructor(
    private readonly providersService: ProvidersService,
    private logger: Logger = new Logger(SmsSnsService.name),
  ) {}

  async assignSnsConfig(providerId: number): Promise<void> {
    this.logger.debug('Started assigning SNS sms client');

    try {
      const snsConfig = await this.providersService.getConfigById(providerId);
      this.sns = new SNS({
        credentials: {
          accessKeyId: snsConfig.AWS_ACCESS_KEY_ID as string,
          secretAccessKey: snsConfig.AWS_SECRET_ACCESS_KEY as string,
        },
        region: snsConfig.AWS_REGION as string,
      });
    } catch (error) {
      this.logger.error('Error assigning SNS configuration', error);
      throw error;
    }
  }

  async sendMessage(data: SmsSnsData, providerId: number): Promise<PublishCommandOutput> {
    await this.assignSnsConfig(providerId);

    // Prepare SNS publish parameters
    const params: PublishCommandInput = {
      Message: data.message,
      PhoneNumber: data.to,
    };

    try {
      this.logger.debug('Sending SNS Sms');
      return await this.sns.publish(params);
    } catch (error) {
      this.logger.error('Error sending SNS SMS', error);
      throw error;
    }
  }
}
