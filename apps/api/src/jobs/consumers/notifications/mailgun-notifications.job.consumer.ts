import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationsService } from 'src/modules/notifications/notifications.service';
import { MAILGUN_QUEUE } from 'src/modules/notifications/queues/mailgun.queue';
import { MailgunService } from 'src/modules/providers/mailgun/mailgun.service';
import { MailgunMessageData } from 'mailgun.js';
import { Notification } from 'src/modules/notifications/entities/notification.entity';
import { NotificationConsumer } from './notification.consumer';

@Processor(MAILGUN_QUEUE)
export class MailgunNotificationConsumer extends NotificationConsumer {
  constructor(
    @InjectRepository(Notification)
    protected readonly notificationRepository: Repository<Notification>,
    private readonly mailgunService: MailgunService,
    notificationsService: NotificationsService,
  ) {
    super(notificationRepository, notificationsService);
  }

  @Process()
  async processMailgunNotificationQueue(job: Job<number>): Promise<void> {
    return super.processNotificationQueue(job, async () => {
      const id = job.data;
      const notification = (await this.notificationsService.getNotificationById(id))[0];
      const formattedNotificationData = await this.mailgunService.formatNotificationData(
        notification.data,
      );
      return this.mailgunService.sendEmail(
        formattedNotificationData as MailgunMessageData,
        notification.providerId,
      );
    });
  }
}
