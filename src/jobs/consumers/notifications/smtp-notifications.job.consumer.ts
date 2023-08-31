import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from 'src/models/notifications/entities/notification.entity';
import { DeliveryStatus } from 'src/common/constants/notifications';
import { SmtpService } from 'src/services/email/smtp/smtp.service';
import * as nodemailer from 'nodemailer';
import { NotificationsService } from 'src/models/notifications/notifications.service';

@Processor('smtpNotifications')
export class SmtpNotificationConsumer {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly smtpService: SmtpService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Process()
  async processSmtpNotificationQueue(job: Job): Promise<void> {
    const id = job.data;
    const notification = (await this.notificationsService.getNotificationById(id))[0];

    try {
      const result = await this.smtpService.sendEmail(
        notification.data as nodemailer.SendMailOptions,
      );
      notification.deliveryStatus = DeliveryStatus.SUCCESS;
      notification.result = { result };
    } catch (error) {
      notification.deliveryStatus = DeliveryStatus.FAILED;
      notification.result = { result: error };
    } finally {
      await this.notificationRepository.save(notification);
    }
  }
}
