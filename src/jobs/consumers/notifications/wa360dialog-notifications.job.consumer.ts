import { Logger } from '@nestjs/common';
import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from 'src/modules/notifications/entities/notification.entity';
import { DeliveryStatus } from 'src/common/constants/notifications';
import { NotificationsService } from 'src/modules/notifications/notifications.service';
import { WA360DIALOG_QUEUE } from 'src/modules/notifications/queues/wa360dialog.queue';
import {
  Wa360DialogData,
  Wa360dialogService,
} from 'src/services/whatsapp/wa360dialog/wa360dialog.service';

@Processor(WA360DIALOG_QUEUE)
export class Wa360dialogNotificationsConsumer {
  private readonly logger = new Logger(Wa360dialogNotificationsConsumer.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly wa360dialogService: Wa360dialogService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Process()
  async processWa360dialogNotificationQueue(job: Job<number>): Promise<void> {
    const id = job.data;
    const notification = (await this.notificationsService.getNotificationById(id))[0];

    try {
      this.logger.log(`Sending notification with id: ${id}`);
      const result = await this.wa360dialogService.sendMessage(
        notification.data as unknown as Wa360DialogData,
      );
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
