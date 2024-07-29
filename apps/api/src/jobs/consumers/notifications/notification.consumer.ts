import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from 'src/modules/notifications/entities/notification.entity';
import {
  DeliveryStatus,
  SkipProviderConfirmationChannels,
} from 'src/common/constants/notifications';
import { NotificationsService } from 'src/modules/notifications/notifications.service';
import { ConfigService } from '@nestjs/config';
import { WebhookService } from 'src/modules/webhook/webhook.service';

@Injectable()
export abstract class NotificationConsumer {
  private readonly logger = new Logger(this.constructor.name);
  private maxRetryCount: number;

  constructor(
    @InjectRepository(Notification)
    protected readonly notificationRepository: Repository<Notification>,
    protected readonly notificationsService: NotificationsService,
    protected readonly webhookService: WebhookService,
    private readonly configService: ConfigService,
  ) {
    this.maxRetryCount = +this.configService.get('MAX_RETRY_COUNT', 3);
  }

  async processNotificationQueue(
    id: number,
    sendNotification: () => Promise<unknown>,
  ): Promise<void> {
    const notification = (await this.notificationsService.getNotificationById(id))[0];

    try {
      this.logger.log(`Sending notification with id: ${id}`);
      this.logger.debug(
        `Processing notification queue for channel type: ${notification.channelType}`,
      );
      const result = await sendNotification();

      if (SkipProviderConfirmationChannels.includes(notification.channelType)) {
        this.logger.debug(
          `Channel type: ${notification.channelType} is included in skip queue. Provider confirmation skipped for notification id ${notification.id}`,
        );
        notification.deliveryStatus = DeliveryStatus.SUCCESS;
        this.webhookService.triggerWebhook(notification);
      } else {
        this.logger.debug(
          `Notification id ${notification.id} is awaiting confirmation from provider`,
        );
        notification.deliveryStatus = DeliveryStatus.AWAITING_CONFIRMATION;
      }

      this.logger.debug(`Updating result of notification with id ${notification.id}`);
      notification.result = { result };
    } catch (error) {
      if (notification.retryCount < this.maxRetryCount) {
        this.logger.debug(
          `Some error occured while sendiing Notification with ID ${notification.id}. Retry Count ${notification.retryCount}/${this.maxRetryCount}. Sending notification again`,
        );
        notification.deliveryStatus = DeliveryStatus.PENDING;
        notification.retryCount++;
      } else {
        this.logger.log(
          `Notification with ID ${notification.id} has attempted max allowed retries (sending), setting delivery status to ${DeliveryStatus.FAILED}`,
        );
        notification.deliveryStatus = DeliveryStatus.FAILED;
      }

      notification.result = { result: { message: error.message, stack: error.stack } };
      this.logger.error(`Error sending notification with id: ${id}`);
      this.logger.error(JSON.stringify(error, ['message', 'stack'], 2));
    } finally {
      await this.notificationRepository.save(notification);
    }
  }

  async processAwaitingConfirmationNotificationQueue(
    id: number,
    getNotificationStatus: () => Promise<{
      result: unknown;
      deliveryStatus: number;
    }>,
  ): Promise<void> {
    const notification = (await this.notificationsService.getNotificationById(id))[0];

    try {
      this.logger.log(`Checking delivery status from provider for notification with id: ${id}`);
      this.logger.debug(
        `Processing awaiting confirmation notification queue for channel type: ${notification.channelType}`,
      );
      const response = await getNotificationStatus();
      notification.result = { result: response.result as Record<string, unknown> };
      notification.deliveryStatus = response.deliveryStatus;

      if (notification.deliveryStatus === DeliveryStatus.PENDING) {
        this.logger.log(
          `Notification with ID ${id} was not sent correctly as per provider. Another attempt will be made to send the notification`,
        );
        this.logger.log('Provider response: ' + JSON.stringify(response.result));

        // Check to prevent program to constantly keep checking for confirmation status
        if (notification.retryCount >= this.maxRetryCount) {
          throw new Error(
            `Max retry count threshold reached by Notification ID: ${notification.id}`,
          );
        }

        notification.retryCount++;
      }

      if (notification.deliveryStatus === DeliveryStatus.SUCCESS) {
        this.webhookService.triggerWebhook(notification);
      }
    } catch (error) {
      if (notification.retryCount < this.maxRetryCount) {
        notification.deliveryStatus = DeliveryStatus.AWAITING_CONFIRMATION;
        notification.retryCount++;
      } else {
        this.logger.log(
          `Notification with ID ${notification.id} has attempted max allowed retries (provider confirmation), setting delivery status to ${DeliveryStatus.FAILED}`,
        );
        notification.deliveryStatus = DeliveryStatus.FAILED;
        this.webhookService.triggerWebhook(notification);
      }

      this.logger.error(
        `Error getting delivery status from provider for notification with id: ${id}`,
      );
      this.logger.error(JSON.stringify(error, ['message', 'stack'], 2));
    } finally {
      this.logger.debug('Saving notification data in DB');
      await this.notificationRepository.save(notification);
    }
  }
}
