import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationsService } from 'src/modules/notifications/notifications.service';
import { Notification } from 'src/modules/notifications/entities/notification.entity';
import { NotificationConsumer } from './notification.consumer';
import { WA_TWILIO_QUEUE } from 'src/modules/notifications/queues/waTwilio.queue';
import {
  WaTwilioData,
  WaTwilioResponseData,
  WaTwilioService,
} from 'src/modules/providers/wa-twilio/wa-twilio.service';
import { DeliveryStatus } from 'src/common/constants/notifications';

@Processor(WA_TWILIO_QUEUE)
export class WaTwilioNotificationsConsumer extends NotificationConsumer {
  constructor(
    @InjectRepository(Notification)
    protected readonly notificationRepository: Repository<Notification>,
    private readonly waTwilioService: WaTwilioService,
    notificationsService: NotificationsService,
  ) {
    super(notificationRepository, notificationsService);
  }

  @Process()
  async processWaTwilioNotificationQueue(job: Job<number>): Promise<void> {
    const id = job.data;
    const notification = (await this.notificationsService.getNotificationById(id))[0];

    if (notification.deliveryStatus === DeliveryStatus.PENDING) {
      return super.processNotificationQueue(job, async () => {
        return this.waTwilioService.sendMessage(
          notification.data as unknown as WaTwilioData,
          notification.providerId,
        );
      });
    }

    if (notification.deliveryStatus === DeliveryStatus.AWAITING_CONFIRMATION) {
      return super.processAwaitingConfirmationNotificationQueue(job, async () => {
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
