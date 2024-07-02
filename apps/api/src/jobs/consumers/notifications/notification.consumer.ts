import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from 'src/modules/notifications/entities/notification.entity';
import { DeliveryStatus } from 'src/common/constants/notifications';
import { NotificationsService } from 'src/modules/notifications/notifications.service';

@Injectable()
export abstract class NotificationConsumer {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    @InjectRepository(Notification)
    protected readonly notificationRepository: Repository<Notification>,
    protected readonly notificationsService: NotificationsService,
  ) {}

  async processNotificationQueue(
    id: number,
    sendNotification: () => Promise<unknown>,
  ): Promise<void> {
    const notification = (await this.notificationsService.getNotificationById(id))[0];

    try {
      this.logger.log(`Sending notification with id: ${id}`);
      const result = await sendNotification();
      notification.deliveryStatus = DeliveryStatus.AWAITING_CONFIRMATION;
      notification.result = { result };
    } catch (error) {
      notification.deliveryStatus = DeliveryStatus.PENDING;
      notification.retryCount++;
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
      notification.deliveryStatus = DeliveryStatus.AWAITING_CONFIRMATION;
      notification.retryCount++;
      this.logger.error(
        `Error getting delivery status from provider for notification with id: ${id}`,
      );
      this.logger.error(JSON.stringify(error, ['message', 'stack'], 2));
    } finally {
      await this.notificationRepository.save(notification);
    }
  }
}
