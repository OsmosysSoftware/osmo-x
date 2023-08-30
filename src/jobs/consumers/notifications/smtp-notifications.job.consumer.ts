import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from 'src/models/notifications/entities/notification.entity';
import { DeliveryStatus } from 'src/common/constants/notifications';
import { SmtpService } from 'src/services/email/smtp/smtp.service';
import * as nodemailer from 'nodemailer';

@Processor('smtpNotifications')
export class SmtpNotificationConsumer {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly smtpService: SmtpService,
  ) {}

  @Process()
  async processSmtpNotificationQueue(job: Job): Promise<void> {
    const id = job.data;
    const notification = (await this.getNotificationById(id))[0];
    try {
      this.smtpService.sendEmail(notification.data as nodemailer.SendMailOptions);
      notification.deliveryStatus = DeliveryStatus.SUCCESS;
    } catch (error) {
      notification.deliveryStatus = DeliveryStatus.FAILED;
    } finally {
      await this.notificationRepository.save(notification);
    }
  }

  getNotificationById(id: number): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: {
        id: id,
      },
    });
  }
}
