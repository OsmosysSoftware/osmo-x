import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationsService } from 'src/modules/notifications/notifications.service';
import { Notification } from 'src/modules/notifications/entities/notification.entity';
import { NotificationConsumer } from './notification.consumer';
import {
  SmsPlivoData,
  SmsPlivoService,
  SmsPlivoResponseData,
} from 'src/modules/providers/sms-plivo/sms-plivo.service';
import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { DeliveryStatus, ProviderDeliveryStatus } from 'src/common/constants/notifications';
import { ConfigService } from '@nestjs/config';
import { WebhookService } from 'src/modules/webhook/webhook.service';
import { RetryNotification } from 'src/modules/notifications/entities/retry-notification.entity';
import { NotificationQueueProducer } from 'src/jobs/producers/notifications/notifications.job.producer';
import { ProviderChainMembersService } from 'src/modules/provider-chain-members/provider-chain-members.service';

@Injectable()
export class SmsPlivoNotificationsConsumer extends NotificationConsumer {
  constructor(
    @InjectRepository(Notification)
    protected readonly notificationRepository: Repository<Notification>,
    @InjectRepository(RetryNotification)
    protected readonly notificationRetryRepository: Repository<RetryNotification>,
    private readonly smsPlivoService: SmsPlivoService,
    @Inject(forwardRef(() => NotificationsService))
    notificationsService: NotificationsService,
    @Inject(forwardRef(() => NotificationQueueProducer))
    notificationsQueueService: NotificationQueueProducer,
    webhookService: WebhookService,
    configService: ConfigService,
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

  async processSmsPlivoNotificationQueue(id: number): Promise<void> {
    return super.processNotificationQueue(id, async () => {
      const notification = (await this.notificationsService.getNotificationById(id))[0];
      return this.smsPlivoService.sendMessage(
        notification.data as unknown as SmsPlivoData,
        notification.providerId,
      );
    });
  }

  async processSmsPlivoNotificationConfirmationQueue(id: number): Promise<void> {
    return super.processAwaitingConfirmationNotificationQueue(id, async () => {
      const notification = (await this.notificationsService.getNotificationById(id))[0];
      const result = await this.smsPlivoService.getDeliveryStatus(
        (notification.result.result as SmsPlivoResponseData).messageUuid as string,
        notification.providerId,
      );
      const deliveryStatus = result.messageState;

      if (ProviderDeliveryStatus.SMS_PLIVO.FAILURE_STATES.includes(deliveryStatus)) {
        return { result, deliveryStatus: DeliveryStatus.PENDING };
      }

      if (ProviderDeliveryStatus.SMS_PLIVO.SUCCESS_STATES.includes(deliveryStatus)) {
        return { result, deliveryStatus: DeliveryStatus.SUCCESS };
      }

      return {
        result,
        deliveryStatus: DeliveryStatus.AWAITING_CONFIRMATION,
      };
    });
  }
}
