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

@Injectable()
export abstract class NotificationConsumer {
  private readonly logger = new Logger(this.constructor.name);
  private maxRetryCount: number;

  constructor(
    @InjectRepository(Notification)
    protected readonly notificationRepository: Repository<Notification>,
    protected readonly notificationsService: NotificationsService,
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
      const result = await sendNotification();

      if (SkipProviderConfirmationChannels.includes(notification.channelType)) {
        notification.deliveryStatus = DeliveryStatus.SUCCESS;
      } else {
        notification.deliveryStatus = DeliveryStatus.AWAITING_CONFIRMATION;
      }

      notification.result = { result };
    } catch (error) {
      if (notification.retryCount < this.maxRetryCount) {
        notification.deliveryStatus = DeliveryStatus.PENDING;
        notification.retryCount++;
      } else {
        this.logger.log(
          `Notification with ID ${notification.id} has attempted max allowed retries (sending), setting delivery status to ${DeliveryStatus.FAILED}`,
        );
        notification.deliveryStatus = DeliveryStatus.FAILED;
      }

      notification.result = { result: error };
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
      const response = await getNotificationStatus();
      notification.result = { result: response.result as Record<string, unknown> };
      notification.deliveryStatus = response.deliveryStatus;

      if (notification.deliveryStatus === DeliveryStatus.PENDING) {
        this.logger.log(
          `Notification with ID ${id} was not sent correctly as per provider. Another attempt will be made to send the notification`,
        );
        this.logger.log('Provider response: ' + JSON.stringify(response.result));
        notification.retryCount++;
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
      }

      this.logger.error(
        `Error getting delivery status from provider for notification with id: ${id}`,
      );
      this.logger.error(JSON.stringify(error, ['message', 'stack'], 2));
    } finally {
      if (notification.retryCount > this.maxRetryCount) {
        this.logger.log(
          `Notification with ID ${notification.id} has attempted max allowed retries (provider confirmation), setting delivery status to ${DeliveryStatus.FAILED}`,
        );
        notification.deliveryStatus = DeliveryStatus.FAILED;
      }

      await this.notificationRepository.save(notification);
    }
  }
}
