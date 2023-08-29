import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from 'src/models/notifications/entities/notification.entity';
import { DeliveryStatus } from 'src/common/constants/notifications';

@Processor('smtpNotifications')
export class SmtpNotificationConsumer {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  @Process()
  async processSmtpNotificationQueue(job: Job): Promise<void> {
    const notification = job.data;
    try {
      notification.deliveryStatus = DeliveryStatus.IN_PROGRESS;
      // TODO: Send the email, update notification values
      notification.deliveryStatus = DeliveryStatus.SUCCESS;
    } catch (error) {
      notification.deliveryStatus = DeliveryStatus.FAILED;
    } finally {
      await this.notificationRepository.save(notification);
    }
  }
}
