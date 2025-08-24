import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationsService } from 'src/modules/notifications/notifications.service';
import { Notification } from 'src/modules/notifications/entities/notification.entity';
import { NotificationConsumer } from './notification.consumer';
import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WebhookService } from 'src/modules/webhook/webhook.service';
import { SmsSnsData, SmsSnsService } from 'src/modules/providers/sms-sns/sms-sns.service';
import { NotificationQueueProducer } from 'src/jobs/producers/notifications/notifications.job.producer';
import { RetryNotification } from 'src/modules/notifications/entities/retry-notification.entity';
import { ProviderChainMembersService } from 'src/modules/provider-chain-members/provider-chain-members.service';
import { ProvidersService } from 'src/modules/providers/providers.service';

@Injectable()
export class SmsSnsNotificationConsumer extends NotificationConsumer {
  constructor(
    @InjectRepository(Notification)
    protected readonly notificationRepository: Repository<Notification>,
    @InjectRepository(RetryNotification)
    protected readonly notificationRetryRepository: Repository<RetryNotification>,
    private readonly smsSnsService: SmsSnsService,
    @Inject(forwardRef(() => NotificationsService))
    notificationsService: NotificationsService,
    @Inject(forwardRef(() => NotificationQueueProducer))
    notificationsQueueService: NotificationQueueProducer,
    configService: ConfigService,
    webhookService: WebhookService,
    providerChainMembersService: ProviderChainMembersService,
    providersService: ProvidersService,
  ) {
    super(
      notificationRepository,
      notificationRetryRepository,
      notificationsService,
      notificationsQueueService,
      webhookService,
      configService,
      providerChainMembersService,
      providersService,
    );
  }

  async processSmsSnsNotificationQueue(id: number): Promise<void> {
    return super.processNotificationQueue(id, async () => {
      const notification = (await this.notificationsService.getNotificationById(id))[0];
      return this.smsSnsService.sendMessage(
        notification.data as unknown as SmsSnsData,
        notification.providerId,
      );
    });
  }
}
