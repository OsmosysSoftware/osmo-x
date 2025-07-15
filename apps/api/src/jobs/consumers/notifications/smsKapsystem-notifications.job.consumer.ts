import { NotificationConsumer } from './notification.consumer';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  KapsystemData,
  SmsKapsystemService,
} from 'src/modules/providers/sms-kapsystem/sms-kapsystem.service';
import { NotificationsService } from 'src/modules/notifications/notifications.service';
import { Notification } from 'src/modules/notifications/entities/notification.entity';
import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WebhookService } from 'src/modules/webhook/webhook.service';
import { RetryNotification } from 'src/modules/notifications/entities/retry-notification.entity';
import { NotificationQueueProducer } from 'src/jobs/producers/notifications/notifications.job.producer';
import { ProviderChainMembersService } from 'src/modules/provider-chain-members/provider-chain-members.service';
import { ProvidersService } from 'src/modules/providers/providers.service';

@Injectable()
export class SmsKapsystemNotificationsConsumer extends NotificationConsumer {
  constructor(
    @InjectRepository(Notification)
    protected readonly notificationRepository: Repository<Notification>,
    @InjectRepository(RetryNotification)
    protected readonly notificationRetryRepository: Repository<RetryNotification>,
    private readonly kapsystemService: SmsKapsystemService,
    @Inject(forwardRef(() => NotificationsService))
    notificationsService: NotificationsService,
    @Inject(forwardRef(() => NotificationQueueProducer))
    notificationsQueueService: NotificationQueueProducer,
    webhookService: WebhookService,
    configService: ConfigService,
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

  async processSmsKapsystemNotificationQueue(id: number): Promise<void> {
    return super.processNotificationQueue(id, async () => {
      const notification = (await this.notificationsService.getNotificationById(id))[0];
      return this.kapsystemService.sendMessage(
        notification.data as unknown as KapsystemData,
        notification.providerId,
      );
    });
  }
}
