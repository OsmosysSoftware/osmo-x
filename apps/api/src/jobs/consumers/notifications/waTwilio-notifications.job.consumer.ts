import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationsService } from 'src/modules/notifications/notifications.service';
import { Notification } from 'src/modules/notifications/entities/notification.entity';
import { NotificationConsumer } from './notification.consumer';
import { WA_TWILIO_QUEUE } from 'src/modules/notifications/queues/waTwilio.queue';
import { WaTwilioData, WaTwilioService } from 'src/modules/providers/wa-twilio/wa-twilio.service';

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
    return super.processNotificationQueue(job, async () => {
      const id = job.data;
      const notification = (await this.notificationsService.getNotificationById(id))[0];
      return this.waTwilioService.sendMessage(notification.data as unknown as WaTwilioData);
    });
  }
}
