import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationsService } from 'src/modules/notifications/notifications.service';
import { Notification } from 'src/modules/notifications/entities/notification.entity';
import { NotificationConsumer } from './notification.consumer';
import { SMS_PLIVO_QUEUE } from 'src/modules/notifications/queues/smsPlivo.queue';
import {
  SmsPlivoData,
  SmsPlivoService,
  PlivoMessageStatusResponse,
} from 'src/modules/providers/sms-plivo/sms-plivo.service';
import { DeliveryStatus } from 'src/common/constants/notifications';

@Processor(SMS_PLIVO_QUEUE)
export class SmsPlivoNotificationsConsumer extends NotificationConsumer {
  constructor(
    @InjectRepository(Notification)
    protected readonly notificationRepository: Repository<Notification>,
    private readonly smsPlivoService: SmsPlivoService,
    notificationsService: NotificationsService,
  ) {
    super(notificationRepository, notificationsService);
  }

  @Process()
  async processSmsPlivoNotificationQueue(job: Job<number>): Promise<void> {
    const id = job.data;
    const notification = (await this.notificationsService.getNotificationById(id))[0];

    if (notification.deliveryStatus === DeliveryStatus.PENDING) {
      return super.processNotificationQueue(job, async () => {
        return this.smsPlivoService.sendMessage(
          notification.data as unknown as SmsPlivoData,
          notification.providerId,
        );
      });
    } else if (notification.deliveryStatus === DeliveryStatus.AWAITING_CONFIRMATION) {
      return super.processAwaitingConfirmationNotificationQueue(job, async () => {
        const result = await this.smsPlivoService.getDeliveryStatus(
          (notification.result.result as PlivoMessageStatusResponse).message_uuid as string,
          notification.providerId,
        );
        const deliveryStatus = result.status;

        if (deliveryStatus === 'expired' || deliveryStatus === 'undelivered') {
          return { result, deliveryStatus: DeliveryStatus.FAILED };
        }

        return { result, deliveryStatus: DeliveryStatus.SUCCESS };
      });
    }
  }
}
