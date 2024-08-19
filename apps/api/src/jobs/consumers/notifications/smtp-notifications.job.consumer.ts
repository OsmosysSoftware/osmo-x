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
import { RetryNotification } from 'src/modules/notifications/entities/retry-notification.entity';

@Injectable()
export class SmtpNotificationConsumer extends NotificationConsumer {
  constructor(
    @InjectRepository(Notification)
    protected readonly notificationRepository: Repository<Notification>,
    @InjectRepository(RetryNotification)
    protected readonly notificationRetryRepository: Repository<RetryNotification>,
    private readonly smtpService: SmtpService,
    @Inject(forwardRef(() => NotificationsService))
    notificationsService: NotificationsService,
    webhookService: WebhookService,
    configService: ConfigService,
  ) {
    super(
      notificationRepository,
      notificationRetryRepository,
      notificationsService,
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
