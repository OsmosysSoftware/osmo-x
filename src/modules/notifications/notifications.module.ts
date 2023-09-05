import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { Notification } from './entities/notification.entity';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationQueueProducer } from 'src/jobs/producers/notifications/notifications.job.producer';
import { SmtpNotificationConsumer } from 'src/jobs/consumers/notifications/smtp-notifications.job.consumer';
import { SmtpService } from 'src/services/email/smtp/smtp.service';
import { ConfigService } from '@nestjs/config';
import { smtpQueueConfig } from './queues/smtp.queue';
import { MailgunService } from 'src/services/email/mailgun/mailgun.service';
import { mailgunQueueConfig } from './queues/mailgun.queue';
import { MailgunNotificationConsumer } from 'src/jobs/consumers/notifications/mailgun-notifications.job.consumer';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification]),
    BullModule.registerQueue(smtpQueueConfig, mailgunQueueConfig),
  ],
  providers: [
    NotificationQueueProducer,
    SmtpNotificationConsumer,
    MailgunNotificationConsumer,
    NotificationsService,
    SmtpService,
    MailgunService,
    ConfigService,
  ],
  exports: [NotificationsService],
  controllers: [NotificationsController],
})
export class NotificationsModule {}
