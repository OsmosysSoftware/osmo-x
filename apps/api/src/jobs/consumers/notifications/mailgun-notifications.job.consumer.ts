import { Logger } from '@nestjs/common';
import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from 'src/modules/notifications/entities/notification.entity';
import { DeliveryStatus } from 'src/common/constants/notifications';
import { MailgunService } from 'src/modules/providers/mailgun/mailgun.service';
import { MailgunMessageData } from 'mailgun.js';
import { NotificationsService } from 'src/modules/notifications/notifications.service';
import { MAILGUN_QUEUE } from 'src/modules/notifications/queues/mailgun.queue';

@Processor(MAILGUN_QUEUE)
export class MailgunNotificationConsumer {
  private readonly logger = new Logger(MailgunNotificationConsumer.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly mailgunService: MailgunService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Process()
  async processMailgunNotificationQueue(job: Job<number>): Promise<void> {
    const id = job.data;
    const notification = (await this.notificationsService.getNotificationById(id))[0];

    try {
      this.logger.log(`Sending notification with id: ${id}`);
      const formattedNotificationData = await this.mailgunService.formatNotificationData(
        notification.data,
      );
      const result = await this.mailgunService.sendEmail(
        formattedNotificationData as MailgunMessageData,
      );
      notification.deliveryStatus = DeliveryStatus.SUCCESS;
      notification.result = { result };
    } catch (error) {
      notification.deliveryStatus = DeliveryStatus.FAILED;
      notification.result = { result: error };
      this.logger.error(`Error sending notification with id: ${id}`);
      this.logger.error(JSON.stringify(error, ['message', 'stack'], 2));
    } finally {
      await this.notificationRepository.save(notification);
    }
  }
}
