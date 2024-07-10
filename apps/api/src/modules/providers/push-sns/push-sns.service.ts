import { Injectable } from '@nestjs/common';
import { SNS } from 'aws-sdk';
import { ProvidersService } from '../providers.service';

export interface PushSnsData {
  target: string;
  message: object;
}

@Injectable()
export class PushSnsService {
  private sns: SNS;

  constructor(private readonly providersService: ProvidersService) {}

  async assignSnsConfig(providerId: number): Promise<void> {
    const snsConfig = await this.providersService.getConfigById(providerId);

    this.sns = new SNS({
      accessKeyId: snsConfig.AWS_ACCESS_KEY_ID as string,
      secretAccessKey: snsConfig.AWS_SECRET_ACCESS_KEY as string,
      region: snsConfig.AWS_REGION as string,
    });
  }

  async sendPushNotification(data: PushSnsData, providerId: number): Promise<SNS.PublishResponse> {
    await this.assignSnsConfig(providerId);

    // Prepare SNS publish parameters
    const params: SNS.PublishInput = {
      Message: JSON.stringify(data.message),
      MessageStructure: 'json',
      TargetArn: data.target,
    };

    return this.sns.publish(params).promise();
  }
}
