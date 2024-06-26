import { Process, Processor } from '@nestjs/bull';
import { NotificationConsumer } from './notification.consumer';
import { SMS_KAPSYSTEM_QUEUE } from 'src/modules/notifications/queues/smsKapsystem.queue';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  KapsystemData,
  KapsystemResponse,
  SmsKapsystemService,
} from 'src/modules/providers/sms-kapsystem/sms-kapsystem.service';
import { NotificationsService } from 'src/modules/notifications/notifications.service';
import { Notification } from 'src/modules/notifications/entities/notification.entity';
import { Job } from 'bull';
import { DeliveryStatus } from 'src/common/constants/notifications';

@Processor(SMS_KAPSYSTEM_QUEUE)
export class SmsKapsystemNotificationsConsumer extends NotificationConsumer {
  constructor(
    @InjectRepository(Notification)
    protected readonly notificationRepository: Repository<Notification>,
    private readonly kapsystemService: SmsKapsystemService,
    notificationsService: NotificationsService,
  ) {
    super(notificationRepository, notificationsService);
  }

  @Process()
  async processSmsKapsystemNotificationQueue(job: Job<number>): Promise<void> {
    const id = job.data;
    const notification = (await this.notificationsService.getNotificationById(id))[0];

    if (notification.deliveryStatus === DeliveryStatus.PENDING) {
      return super.processNotificationQueue(job, async () => {
        return this.kapsystemService.sendMessage(
          notification.data as unknown as KapsystemData,
          notification.providerId,
        );
      });
    } else if (notification.deliveryStatus === DeliveryStatus.AWAITING_CONFIRMATION) {
      return super.processAwaitingConfirmationNotificationQueue(job, async () => {
        const result = await this.kapsystemService.getDeliveryStatus(
          (notification.result.result as KapsystemResponse).results.result.messageid as string,
          notification.providerId,
        );
        const deliveryStatus = result.results.result.status;

        if (deliveryStatus === 'EXPIRED' || deliveryStatus === 'UNDELIV') {
          return { result, deliveryStatus: DeliveryStatus.FAILED };
        }

        return { result, deliveryStatus: DeliveryStatus.SUCCESS };
      });
    }
  }
}
