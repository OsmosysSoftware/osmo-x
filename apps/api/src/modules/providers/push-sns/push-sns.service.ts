import { Injectable } from '@nestjs/common';
import { SNS } from 'aws-sdk';
import { ProvidersService } from '../providers.service';

export interface PushSnsData {
  target: string;
  title: string;
  body: string;
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
    const { title, body } = data;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload: any = {
      GCM: {
        notification: {},
      },
    };

    // Conditionally add title and body to notification object
    if (title) payload.GCM.notification.title = title;
    if (body) payload.GCM.notification.body = body;

    // Convert entire payload to JSON string
    const messagePayload = JSON.stringify(payload);

    // Prepare SNS publish parameters
    const params: SNS.PublishInput = {
      Message: messagePayload,
      MessageStructure: 'json',
      TargetArn: data.target,
    };

    return this.sns.publish(params).promise();
  }
}
