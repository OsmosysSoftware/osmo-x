import { Logger } from '@nestjs/common';
import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from 'src/modules/notifications/entities/notification.entity';
import { DeliveryStatus } from 'src/common/constants/notifications';
import * as nodemailer from 'nodemailer';
import { NotificationsService } from 'src/modules/notifications/notifications.service';
import { SMTP_QUEUE } from 'src/modules/notifications/queues/smtp.queue';
import { SmtpService } from 'src/modules/providers/smtp/smtp.service';

@Processor(SMTP_QUEUE)
export class SmtpNotificationConsumer {
  private readonly logger = new Logger(SmtpNotificationConsumer.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly smtpService: SmtpService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Process()
  async processSmtpNotificationQueue(job: Job<number>): Promise<void> {
    const id = job.data;
    const notification = (await this.notificationsService.getNotificationById(id))[0];

    try {
      this.logger.log(`Sending notification with id: ${id}`);
      const result = await this.smtpService.sendEmail(
        notification.data as nodemailer.SendMailOptions,
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