import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationsService } from 'src/modules/notifications/notifications.service';
import { Notification } from 'src/modules/notifications/entities/notification.entity';
import { NotificationConsumer } from './notification.consumer';
import { SMS_TWILIO_QUEUE } from 'src/modules/notifications/queues/smsTwilio.queue';
import {
  SmsTwilioData,
  SmsTwilioService,
} from 'src/modules/providers/sms-twilio/sms-twilio.service';

@Processor(SMS_TWILIO_QUEUE)
export class SmsTwilioNotificationsConsumer extends NotificationConsumer {
  constructor(
    @InjectRepository(Notification)
    protected readonly notificationRepository: Repository<Notification>,
    private readonly smsTwilioService: SmsTwilioService,
    notificationsService: NotificationsService,
  ) {
    super(notificationRepository, notificationsService);
  }

  @Process()
  async processSmsTwilioNotificationQueue(job: Job<number>): Promise<void> {
    return super.processNotificationQueue(job, async () => {
      const id = job.data;
      const notification = (await this.notificationsService.getNotificationById(id))[0];
      return this.smsTwilioService.sendMessage(notification.data as unknown as SmsTwilioData);
    });
  }
}
