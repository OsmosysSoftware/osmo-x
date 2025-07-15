import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationsService } from 'src/modules/notifications/notifications.service';
import { Notification } from 'src/modules/notifications/entities/notification.entity';
import { NotificationConsumer } from './notification.consumer';
import {
  WaTwilioData,
  WaTwilioResponseData,
  WaTwilioService,
} from 'src/modules/providers/wa-twilio/wa-twilio.service';
import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { DeliveryStatus, ProviderDeliveryStatus } from 'src/common/constants/notifications';
import { ConfigService } from '@nestjs/config';
import { WebhookService } from 'src/modules/webhook/webhook.service';
import { RetryNotification } from 'src/modules/notifications/entities/retry-notification.entity';
import { NotificationQueueProducer } from 'src/jobs/producers/notifications/notifications.job.producer';
import { ProviderChainMembersService } from 'src/modules/provider-chain-members/provider-chain-members.service';
import { ProvidersService } from 'src/modules/providers/providers.service';

@Injectable()
export class WaTwilioNotificationsConsumer extends NotificationConsumer {
  constructor(
    @InjectRepository(Notification)
    protected readonly notificationRepository: Repository<Notification>,
    @InjectRepository(RetryNotification)
    protected readonly notificationRetryRepository: Repository<RetryNotification>,
    private readonly waTwilioService: WaTwilioService,
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

  async processWaTwilioNotificationQueue(id: number): Promise<void> {
    return super.processNotificationQueue(id, async () => {
      const notification = (await this.notificationsService.getNotificationById(id))[0];
      return this.waTwilioService.sendMessage(
        notification.data as unknown as WaTwilioData,
        notification.providerId,
      );
    });
  }

  async processWaTwilioNotificationConfirmationQueue(id: number): Promise<void> {
    return super.processAwaitingConfirmationNotificationQueue(id, async () => {
      const notification = (await this.notificationsService.getNotificationById(id))[0];
      const result = await this.waTwilioService.getDeliveryStatus(
        (notification.result.result as WaTwilioResponseData).sid as string,
        notification.providerId,
      );
      const deliveryStatus = result.status;

      if (ProviderDeliveryStatus.WA_TWILIO.FAILURE_STATES.includes(deliveryStatus)) {
        return { result, deliveryStatus: DeliveryStatus.PENDING };
      }

      if (ProviderDeliveryStatus.WA_TWILIO.SUCCESS_STATES.includes(deliveryStatus)) {
        return { result, deliveryStatus: DeliveryStatus.SUCCESS };
      }

      return {
        result,
        deliveryStatus: DeliveryStatus.AWAITING_CONFIRMATION,
      };
    });
  }
}
