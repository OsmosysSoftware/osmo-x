import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationsService } from 'src/modules/notifications/notifications.service';
import { WA360DIALOG_QUEUE } from 'src/modules/notifications/queues/wa360dialog.queue';
import {
  Wa360DialogData,
  Wa360dialogService,
} from 'src/modules/providers/wa360dialog/wa360dialog.service';
import { Notification } from 'src/modules/notifications/entities/notification.entity';
import { NotificationConsumer } from './notification.consumer';
import { DeliveryStatus } from 'src/common/constants/notifications';

@Processor(WA360DIALOG_QUEUE)
export class Wa360dialogNotificationsConsumer extends NotificationConsumer {
  constructor(
    @InjectRepository(Notification)
    protected readonly notificationRepository: Repository<Notification>,
    private readonly wa360dialogService: Wa360dialogService,
    notificationsService: NotificationsService,
  ) {
    super(notificationRepository, notificationsService);
  }

  @Process()
  async processWa360dialogNotificationQueue(job: Job<number>): Promise<void> {
    const id = job.data;
    const notification = (await this.notificationsService.getNotificationById(id))[0];

    if (notification.deliveryStatus === DeliveryStatus.PENDING) {
      return super.processNotificationQueue(job, async () => {
        return this.wa360dialogService.sendMessage(
          notification.data as unknown as Wa360DialogData,
          notification.providerId,
        );
      });
    } else if (notification.deliveryStatus === DeliveryStatus.AWAITING_CONFIRMATION) {
      return super.process360DialogAwaitingConfirmationNotificationQueue(job);
    }
  }
}
