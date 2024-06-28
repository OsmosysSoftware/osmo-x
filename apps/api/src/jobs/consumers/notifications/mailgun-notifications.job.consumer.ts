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
import { DeliveryStatus } from 'src/common/constants/notifications';
import { MessagesSendResult } from 'mailgun.js';

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
    const id = job.data;
    const notification = (await this.notificationsService.getNotificationById(id))[0];

    if (notification.deliveryStatus === DeliveryStatus.PENDING) {
      return super.processNotificationQueue(job, async () => {
        const formattedNotificationData = await this.mailgunService.formatNotificationData(
          notification.data,
        );
        return this.mailgunService.sendEmail(
          formattedNotificationData as MailgunMessageData,
          notification.providerId,
        );
      });
    }

    if (notification.deliveryStatus === DeliveryStatus.AWAITING_CONFIRMATION) {
      return super.processAwaitingConfirmationNotificationQueue(job, async () => {
        const notificationSendResponse = notification.result.result as MessagesSendResult;
        const result = await this.mailgunService.getDeliverStatus(
          notificationSendResponse.id,
          notification.providerId,
        );

        const deliveryStatus = result.event;

        if (deliveryStatus === 'failed' || deliveryStatus === 'rejected') {
          return { result, deliveryStatus: DeliveryStatus.PENDING };
        }

        return { result, deliveryStatus: DeliveryStatus.SUCCESS };
      });
    }
  }
}
