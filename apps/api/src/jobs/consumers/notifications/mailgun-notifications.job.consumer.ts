import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationsService } from 'src/modules/notifications/notifications.service';
import { MailgunService } from 'src/modules/providers/mailgun/mailgun.service';
import { MailgunMessageData } from 'mailgun.js';
import { Notification } from 'src/modules/notifications/entities/notification.entity';
import { NotificationConsumer } from './notification.consumer';
import { DeliveryStatus, ProviderDeliveryStatus } from 'src/common/constants/notifications';
import { MessagesSendResult } from 'mailgun.js';
import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WebhookService } from 'src/modules/webhook/webhook.service';
import { NotificationQueueProducer } from 'src/jobs/producers/notifications/notifications.job.producer';

@Injectable()
export class MailgunNotificationConsumer extends NotificationConsumer {
  constructor(
    @InjectRepository(Notification)
    protected readonly notificationRepository: Repository<Notification>,
    private readonly mailgunService: MailgunService,
    @Inject(forwardRef(() => NotificationsService))
    notificationsService: NotificationsService,
    @Inject(forwardRef(() => NotificationQueueProducer))
    notificationsQueueService: NotificationQueueProducer,
    webhookService: WebhookService,
    configService: ConfigService,
  ) {
    super(
      notificationRepository,
      notificationsService,
      notificationsQueueService,
      webhookService,
      configService,
    );
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
      const notificationSendResponse = notification.result.result as MessagesSendResult;

      const result = await this.mailgunService.getDeliveryStatus(
        notificationSendResponse.id,
        notification.providerId,
      );
      const deliveryStatus = result.event;
      notificationSendResponse.message = result.event;

      if (ProviderDeliveryStatus.MAILGUN.FAILURE_STATES.includes(deliveryStatus)) {
        return { result: notificationSendResponse, deliveryStatus: DeliveryStatus.PENDING };
      }

      if (ProviderDeliveryStatus.MAILGUN.SUCCESS_STATES.includes(deliveryStatus)) {
        return { result: notificationSendResponse, deliveryStatus: DeliveryStatus.SUCCESS };
      }

      return {
        result: notificationSendResponse,
        deliveryStatus: DeliveryStatus.AWAITING_CONFIRMATION,
      };
    });
  }
}
