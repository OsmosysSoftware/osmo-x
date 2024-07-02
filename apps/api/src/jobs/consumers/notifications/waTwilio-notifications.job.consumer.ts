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
import { DeliveryStatus } from 'src/common/constants/notifications';

@Injectable()
export class WaTwilioNotificationsConsumer extends NotificationConsumer {
  constructor(
    @InjectRepository(Notification)
    protected readonly notificationRepository: Repository<Notification>,
    private readonly waTwilioService: WaTwilioService,
    @Inject(forwardRef(() => NotificationsService))
    notificationsService: NotificationsService,
  ) {
    super(notificationRepository, notificationsService);
  }

  async processWaTwilioNotificationQueue(id: number): Promise<void> {
    const notification = (await this.notificationsService.getNotificationById(id))[0];

    if (notification.deliveryStatus === DeliveryStatus.PENDING) {
      return super.processNotificationQueue(id, async () => {
        return this.waTwilioService.sendMessage(
          notification.data as unknown as WaTwilioData,
          notification.providerId,
        );
      });
    }

    if (notification.deliveryStatus === DeliveryStatus.AWAITING_CONFIRMATION) {
      return super.processAwaitingConfirmationNotificationQueue(id, async () => {
        const result = await this.waTwilioService.getDeliveryStatus(
          (notification.result.result as WaTwilioResponseData).sid as string,
          notification.providerId,
        );
        const deliveryStatus = result.status;

        if (deliveryStatus === 'failed' || deliveryStatus === 'undelivered') {
          return { result, deliveryStatus: DeliveryStatus.PENDING };
        }

        return { result, deliveryStatus: DeliveryStatus.SUCCESS };
      });
    }
  }
}
