import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationsService } from 'src/modules/notifications/notifications.service';
import { Notification } from 'src/modules/notifications/entities/notification.entity';
import { NotificationConsumer } from './notification.consumer';
import {
  WaTwilioBusinessData,
  WaTwilioBusinessResponseData,
  WaTwilioBusinessService,
} from 'src/modules/providers/wa-twilio-business/wa-twilio-business.service';
import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProviderDeliveryStatus, DeliveryStatus } from 'src/common/constants/notifications';
import { WebhookService } from 'src/modules/webhook/webhook.service';

@Injectable()
export class WaTwilioBusinessNotificationsConsumer extends NotificationConsumer {
  constructor(
    @InjectRepository(Notification)
    protected readonly notificationRepository: Repository<Notification>,
    private readonly waTwilioBusinessService: WaTwilioBusinessService,
    @Inject(forwardRef(() => NotificationsService))
    notificationsService: NotificationsService,
    webhookService: WebhookService,
    configService: ConfigService,
  ) {
    super(notificationRepository, notificationsService, webhookService, configService);
  }

  async processWaTwilioBusinessNotificationQueue(id: number): Promise<void> {
    return super.processNotificationQueue(id, async () => {
      const notification = (await this.notificationsService.getNotificationById(id))[0];
      return this.waTwilioBusinessService.sendMessage(
        notification.data as unknown as WaTwilioBusinessData,
        notification.providerId,
      );
    });
  }

  async processWaTwilioBusinessNotificationConfirmationQueue(id: number): Promise<void> {
    return super.processAwaitingConfirmationNotificationQueue(id, async () => {
      const notification = (await this.notificationsService.getNotificationById(id))[0];
      const result = await this.waTwilioBusinessService.getDeliveryStatus(
        (notification.result.result as WaTwilioBusinessResponseData).sid as string,
        notification.providerId,
      );
      const deliveryStatus = result.status;

      if (ProviderDeliveryStatus.WA_TWILIO_BUSINESS.FAILURE_STATES.includes(deliveryStatus)) {
        return { result, deliveryStatus: DeliveryStatus.PENDING };
      }

      if (ProviderDeliveryStatus.WA_TWILIO_BUSINESS.SUCCESS_STATES.includes(deliveryStatus)) {
        return { result, deliveryStatus: DeliveryStatus.SUCCESS };
      }

      return {
        result,
        deliveryStatus: DeliveryStatus.AWAITING_CONFIRMATION,
      };
    });
  }
}
