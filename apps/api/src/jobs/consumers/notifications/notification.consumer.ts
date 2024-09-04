import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from 'src/modules/notifications/entities/notification.entity';
import {
  DeliveryStatus,
  QueueAction,
  SkipProviderConfirmationChannels,
} from 'src/common/constants/notifications';
import { NotificationsService } from 'src/modules/notifications/notifications.service';
import { ConfigService } from '@nestjs/config';
import { WebhookService } from 'src/modules/webhook/webhook.service';
import { RetryNotification } from 'src/modules/notifications/entities/retry-notification.entity';
import { NotificationQueueProducer } from 'src/jobs/producers/notifications/notifications.job.producer';

@Injectable()
export abstract class NotificationConsumer {
  private readonly logger = new Logger(this.constructor.name);
  private maxRetryCount: number;

  constructor(
    @InjectRepository(Notification)
    protected readonly notificationRepository: Repository<Notification>,
    @InjectRepository(RetryNotification)
    protected readonly notificationRetryRepository: Repository<RetryNotification>,
    protected readonly notificationsService: NotificationsService,
    private readonly notificationQueueService: NotificationQueueProducer,
    protected readonly webhookService: WebhookService,
    private readonly configService: ConfigService,
  ) {
    this.maxRetryCount = +this.configService.get('MAX_RETRY_COUNT', 3);
  }

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type, @typescript-eslint/no-explicit-any
  private async saveRetryAttempt(notification: Notification, result: any) {
    await this.notificationRetryRepository.save({
      notification,
      notification_id: notification.id,
      retryCount: notification.retryCount,
      retryResult: JSON.stringify(result),
      status: notification.deliveryStatus,
      createdBy: 'system',
      modifiedBy: 'system',
    });
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
        await this.notificationRepository.save(notification);
        await this.notificationQueueService.addNotificationToQueue(
          QueueAction.WEBHOOK,
          notification,
        );
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
          `Some error occurred while sending Notification with ID ${notification.id}. Retry Count ${notification.retryCount}/${this.maxRetryCount}. Sending notification again`,
        );
        notification.deliveryStatus = DeliveryStatus.PENDING;
        notification.retryCount++;
      } else {
        this.logger.log(
          `Notification with ID ${notification.id} has attempted max allowed retries (sending), setting delivery status to ${DeliveryStatus.FAILED}`,
        );
        notification.deliveryStatus = DeliveryStatus.FAILED;
      }

      this.logger.debug(`Updating result of notification with id ${notification.id}`);
      notification.result = { result: { message: error.message, stack: error.stack } };
      this.logger.error(`Error sending notification with id: ${id}`);
      this.logger.error(JSON.stringify(error, ['message', 'stack'], 2));

      // Save retry attempt record
      await this.saveRetryAttempt(notification, { message: error.message, stack: error.stack });
    } finally {
      this.logger.debug(
        `processNotificationQueue completed. Saving notification in DB: ${JSON.stringify(notification)}`,
      );
      await this.notificationRepository.save(notification);

      // Save retry attempt record if retry count > 0
      if (notification.retryCount > 0) {
        await this.saveRetryAttempt(notification, notification.result);
      }
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
      this.logger.debug(`Updating result of notification with id ${notification.id}`);
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
        await this.notificationRepository.save(notification);
        await this.notificationQueueService.addNotificationToQueue(
          QueueAction.WEBHOOK,
          notification,
        );
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
        await this.notificationRepository.save(notification);
        await this.notificationQueueService.addNotificationToQueue(
          QueueAction.WEBHOOK,
          notification,
        );
      }

      this.logger.error(
        `Error getting delivery status from provider for notification with id: ${id}`,
      );
      this.logger.error(JSON.stringify(error, ['message', 'stack'], 2));

      // Save retry attempt record
      await this.saveRetryAttempt(notification, { message: error.message, stack: error.stack });
    } finally {
      this.logger.debug(
        `processAwaitingConfirmationNotificationQueue completed. Saving notification in DB: ${JSON.stringify(notification)}`,
      );
      await this.notificationRepository.save(notification);

      // Save retry attempt record if retry count > 0
      if (notification.retryCount > 0) {
        await this.saveRetryAttempt(notification, notification.result);
      }
    }
  }
}
