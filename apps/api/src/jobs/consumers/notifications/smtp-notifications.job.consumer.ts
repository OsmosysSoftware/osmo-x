import * as nodemailer from 'nodemailer';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationsService } from 'src/modules/notifications/notifications.service';
import { SmtpService } from 'src/modules/providers/smtp/smtp.service';
import { Notification } from 'src/modules/notifications/entities/notification.entity';
import { NotificationConsumer } from './notification.consumer';
import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WebhookService } from 'src/modules/webhook/webhook.service';
import { NotificationQueueProducer } from 'src/jobs/producers/notifications/notifications.job.producer';

@Injectable()
export class SmtpNotificationConsumer extends NotificationConsumer {
  constructor(
    @InjectRepository(Notification)
    protected readonly notificationRepository: Repository<Notification>,
    private readonly smtpService: SmtpService,
    @Inject(forwardRef(() => NotificationsService))
    notificationsService: NotificationsService,
    @Inject(forwardRef(() => NotificationQueueProducer))
    notificationsQueueService: NotificationQueueProducer,
    webhookService: WebhookService,
    configService: ConfigService,
  ) {
    super(
      notificationRepository,
      notificationsService,
      notificationsQueueService,
      webhookService,
      configService,
    );
  }

  async processSmtpNotificationQueue(id: number): Promise<void> {
    return super.processNotificationQueue(id, async () => {
      const notification = (await this.notificationsService.getNotificationById(id))[0];
      return this.smtpService.sendEmail(
        notification.data as nodemailer.SendMailOptions,
        notification.providerId,
      );
    });
  }
}
