import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationsService } from 'src/modules/notifications/notifications.service';
import { Notification } from 'src/modules/notifications/entities/notification.entity';
import { NotificationConsumer } from './notification.consumer';
import {
  VcTwilioData,
  VcTwilioResponseData,
  VcTwilioService,
} from 'src/modules/providers/vc-twilio/vc-twilio.service';
import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DeliveryStatus, ProviderDeliveryStatus } from 'src/common/constants/notifications';
import { WebhookService } from 'src/modules/webhook/webhook.service';

@Injectable()
export class VcTwilioNotificationsConsumer extends NotificationConsumer {
  constructor(
    @InjectRepository(Notification)
    protected readonly notificationRepository: Repository<Notification>,
    private readonly vcTwilioService: VcTwilioService,
    @Inject(forwardRef(() => NotificationsService))
    notificationsService: NotificationsService,
    webhookService: WebhookService,
    configService: ConfigService,
  ) {
    super(notificationRepository, notificationsService, webhookService, configService);
  }

  async processVcTwilioNotificationQueue(id: number): Promise<void> {
    return super.processNotificationQueue(id, async () => {
      const notification = (await this.notificationsService.getNotificationById(id))[0];
      return this.vcTwilioService.sendVoiceCall(
        notification.data as unknown as VcTwilioData,
        notification.providerId,
      );
    });
  }

  async processVcTwilioNotificationConfirmationQueue(id: number): Promise<void> {
    return super.processAwaitingConfirmationNotificationQueue(id, async () => {
      const notification = (await this.notificationsService.getNotificationById(id))[0];
      const result = await this.vcTwilioService.getDeliveryStatus(
        (notification.result.result as VcTwilioResponseData).sid as string,
        notification.providerId,
      );
      const deliveryStatus = result.status;

      if (ProviderDeliveryStatus.VC_TWILIO.FAILURE_STATES.includes(deliveryStatus)) {
        return { result, deliveryStatus: DeliveryStatus.PENDING };
      }

      if (ProviderDeliveryStatus.VC_TWILIO.SUCCESS_STATES.includes(deliveryStatus)) {
        return { result, deliveryStatus: DeliveryStatus.SUCCESS };
      }

      return {
        result,
        deliveryStatus: DeliveryStatus.AWAITING_CONFIRMATION,
      };
    });
  }
}
