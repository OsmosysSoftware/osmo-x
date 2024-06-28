import { Job } from 'bullmq';
import * as nodemailer from 'nodemailer';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationsService } from 'src/modules/notifications/notifications.service';
import { SmtpService } from 'src/modules/providers/smtp/smtp.service';
import { Notification } from 'src/modules/notifications/entities/notification.entity';
import { NotificationConsumer } from './notification.consumer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class SmtpNotificationConsumer extends NotificationConsumer {
  constructor(
    @InjectRepository(Notification)
    protected readonly notificationRepository: Repository<Notification>,
    private readonly smtpService: SmtpService,
    notificationsService: NotificationsService,
  ) {
    super(notificationRepository, notificationsService);
  }

  async processSmtpNotificationQueue(job: Job<number>): Promise<void> {
    return super.processNotificationQueue(job, async () => {
      const id = job.data;
      const notification = (await this.notificationsService.getNotificationById(id))[0];
      return this.smtpService.sendEmail(
        notification.data as nodemailer.SendMailOptions,
        notification.providerId,
      );
    });
  }
}
