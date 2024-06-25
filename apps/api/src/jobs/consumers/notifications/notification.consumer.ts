import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from 'src/modules/notifications/entities/notification.entity';
import { DeliveryStatus } from 'src/common/constants/notifications';
import { NotificationsService } from 'src/modules/notifications/notifications.service';
import { WaTwilioResponseData } from 'src/modules/providers/wa-twilio/wa-twilio.service';

export abstract class NotificationConsumer {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    @InjectRepository(Notification)
    protected readonly notificationRepository: Repository<Notification>,
    protected readonly notificationsService: NotificationsService,
  ) {}

  async processNotificationQueue(
    job: Job<number>,
    sendNotification: () => Promise<unknown>,
  ): Promise<void> {
    const id = job.data;
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
    job: Job<number>,
    getNotificationStatus: () => Promise<unknown>,
  ): Promise<void> {
    const id = job.data;
    const notification = (await this.notificationsService.getNotificationById(id))[0];

    try {
      this.logger.log(`Checking delivery status from provider for notification with id: ${id}`);
      const result = (await getNotificationStatus()) as WaTwilioResponseData;

      const deliveryStatus = result.status;

      if (deliveryStatus === 'failed' || deliveryStatus === 'undelivered') {
        notification.deliveryStatus = DeliveryStatus.FAILED;
      } else {
        notification.deliveryStatus = DeliveryStatus.SUCCESS;
      }
    } catch (error) {
      notification.deliveryStatus = DeliveryStatus.AWAITING_CONFIRMATION;
      notification.retryCount++;
      notification.result = { result: error };
      this.logger.error(
        `Error getting delivery status from provider for notification with id: ${id}`,
      );
      this.logger.error(JSON.stringify(error, ['message', 'stack'], 2));
    } finally {
      await this.notificationRepository.save(notification);
    }
  }
}
