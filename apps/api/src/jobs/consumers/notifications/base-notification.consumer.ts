import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from 'src/modules/notifications/entities/notification.entity';
import { DeliveryStatus } from 'src/common/constants/notifications';
import { NotificationsService } from 'src/modules/notifications/notifications.service';

export abstract class BaseNotificationConsumer {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    @InjectRepository(Notification)
    protected readonly notificationRepository: Repository<Notification>,
    protected readonly notificationsService: NotificationsService,
  ) {}

  async processNotificationQueue(
    job: Job<number>,
    sendNotificationFn: () => Promise<unknown>,
  ): Promise<void> {
    const id = job.data;
    const notification = (await this.notificationsService.getNotificationById(id))[0];

    try {
      this.logger.log(`Sending notification with id: ${id}`);
      const result = await sendNotificationFn();
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
