import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationsService } from 'src/modules/notifications/notifications.service';
import { Notification } from 'src/modules/notifications/entities/notification.entity';
import { NotificationConsumer } from './notification.consumer';
import {
  SmsTwilioData,
  SmsTwilioResponseData,
  SmsTwilioService,
} from 'src/modules/providers/sms-twilio/sms-twilio.service';
import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DeliveryStatus, ProviderDeliveryStatus } from 'src/common/constants/notifications';
import { WebhookService } from 'src/modules/webhook/webhook.service';
import { RetryNotification } from 'src/modules/notifications/entities/retry-notification.entity';

@Injectable()
export class SmsTwilioNotificationsConsumer extends NotificationConsumer {
  constructor(
    @InjectRepository(Notification)
    protected readonly notificationRepository: Repository<Notification>,
    @InjectRepository(RetryNotification)
    protected readonly notificationRetryRepository: Repository<RetryNotification>,
    private readonly smsTwilioService: SmsTwilioService,
    @Inject(forwardRef(() => NotificationsService))
    notificationsService: NotificationsService,
    webhookService: WebhookService,
    configService: ConfigService,
  ) {
    super(
      notificationRepository,
      notificationRetryRepository,
      notificationsService,
      webhookService,
      configService,
    );
  }

  async processSmsTwilioNotificationQueue(id: number): Promise<void> {
    return super.processNotificationQueue(id, async () => {
      const notification = (await this.notificationsService.getNotificationById(id))[0];
      return this.smsTwilioService.sendMessage(
        notification.data as unknown as SmsTwilioData,
        notification.providerId,
      );
    });
  }

  async processSmsTwilioNotificationConfirmationQueue(id: number): Promise<void> {
    return super.processAwaitingConfirmationNotificationQueue(id, async () => {
      const notification = (await this.notificationsService.getNotificationById(id))[0];
      const result = await this.smsTwilioService.getDeliveryStatus(
        (notification.result.result as SmsTwilioResponseData).sid as string,
        notification.providerId,
      );
      const deliveryStatus = result.status;

      if (ProviderDeliveryStatus.SMS_TWILIO.FAILURE_STATES.includes(deliveryStatus)) {
        return { result, deliveryStatus: DeliveryStatus.PENDING };
      }

      if (ProviderDeliveryStatus.SMS_TWILIO.SUCCESS_STATES.includes(deliveryStatus)) {
        return { result, deliveryStatus: DeliveryStatus.SUCCESS };
      }

      return {
        result,
        deliveryStatus: DeliveryStatus.AWAITING_CONFIRMATION,
      };
    });
  }
}
