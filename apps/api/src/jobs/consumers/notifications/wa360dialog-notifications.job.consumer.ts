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
import { BaseNotificationConsumer } from './base-notification.consumer';

@Processor(WA360DIALOG_QUEUE)
export class Wa360dialogNotificationsConsumer extends BaseNotificationConsumer {
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
    return super.processNotificationQueue(job, async () => {
      const id = job.data;
      const notification = (await this.notificationsService.getNotificationById(id))[0];
      return this.wa360dialogService.sendMessage(notification.data as unknown as Wa360DialogData);
    });
  }
}
