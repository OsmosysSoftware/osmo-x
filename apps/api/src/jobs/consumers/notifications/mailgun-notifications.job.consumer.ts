import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationsService } from 'src/modules/notifications/notifications.service';
import { MailgunService } from 'src/modules/providers/mailgun/mailgun.service';
import { MailgunMessageData } from 'mailgun.js';
import { Notification } from 'src/modules/notifications/entities/notification.entity';
import { NotificationConsumer } from './notification.consumer';
import { DeliveryStatus } from 'src/common/constants/notifications';
import { MessagesSendResult } from 'mailgun.js';
import { Inject, Injectable, forwardRef } from '@nestjs/common';

@Injectable()
export class MailgunNotificationConsumer extends NotificationConsumer {
  constructor(
    @InjectRepository(Notification)
    protected readonly notificationRepository: Repository<Notification>,
    private readonly mailgunService: MailgunService,
    @Inject(forwardRef(() => NotificationsService))
    notificationsService: NotificationsService,
  ) {
    super(notificationRepository, notificationsService);
  }

  async processMailgunNotificationQueue(id: number): Promise<void> {
    return super.processNotificationQueue(id, async () => {
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

  async processMailgunNotificationConfirmationQueue(id: number): Promise<void> {
    return super.processAwaitingConfirmationNotificationQueue(id, async () => {
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
    });
  }
}
