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
