import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationsService } from 'src/modules/notifications/notifications.service';
import { Notification } from 'src/modules/notifications/entities/notification.entity';
import { NotificationConsumer } from './notification.consumer';
import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { WebhookService } from 'src/modules/webhook/webhook.service';
import { AwsSesData, AwsSesService } from 'src/modules/providers/aws-ses/aws-ses.service';
import { NotificationQueueProducer } from 'src/jobs/producers/notifications/notifications.job.producer';
import { RetryNotification } from 'src/modules/notifications/entities/retry-notification.entity';
import { ProviderChainMembersService } from 'src/modules/provider-chain-members/provider-chain-members.service';

@Injectable()
export class AwsSesNotificationConsumer extends NotificationConsumer {
  constructor(
    @InjectRepository(Notification)
    protected readonly notificationRepository: Repository<Notification>,
    @InjectRepository(RetryNotification)
    protected readonly notificationRetryRepository: Repository<RetryNotification>,
    private readonly awsSesService: AwsSesService,
    @Inject(forwardRef(() => NotificationsService))
    notificationsService: NotificationsService,
    @Inject(forwardRef(() => NotificationQueueProducer))
    notificationsQueueService: NotificationQueueProducer,
    configService: ConfigService,
    webhookService: WebhookService,
    providerChainMembersService: ProviderChainMembersService,
  ) {
    super(
      notificationRepository,
      notificationRetryRepository,
      notificationsService,
      notificationsQueueService,
      webhookService,
      configService,
      providerChainMembersService,
    );
  }

  async processAwsSesNotificationQueue(id: number): Promise<void> {
    return super.processNotificationQueue(id, async () => {
      const notification = (await this.notificationsService.getNotificationById(id))[0];
      const formattedNotificationData = await this.awsSesService.formatNotificationData(
        notification.data,
      );
      return this.awsSesService.sendAwsSes(
        formattedNotificationData as unknown as AwsSesData,
        notification.providerId,
      );
    });
  }
}
