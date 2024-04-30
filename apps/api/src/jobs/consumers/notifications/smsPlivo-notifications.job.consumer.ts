import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationsService } from 'src/modules/notifications/notifications.service';
import { Notification } from 'src/modules/notifications/entities/notification.entity';
import { NotificationConsumer } from './notification.consumer';
import { SMS_PLIVO_QUEUE } from 'src/modules/notifications/queues/smsPlivo.queue';
import { SmsPlivoData, SmsPlivoService } from 'src/modules/providers/sms-plivo/sms-plivo.service';

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
    return super.processNotificationQueue(job, async () => {
      const id = job.data;
      const notification = (await this.notificationsService.getNotificationById(id))[0];
      return this.smsPlivoService.sendMessage(
        notification.data as unknown as SmsPlivoData,
        notification.providerId,
      );
    });
  }
}
