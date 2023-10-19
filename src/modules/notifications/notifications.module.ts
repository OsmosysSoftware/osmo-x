import { Module, Logger } from '@nestjs/common';
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
import { JsendFormatter } from 'src/common/jsend-formatter';
import { wa360DialogQueueConfig } from './queues/wa360dialog.queue';
import { Wa360dialogService } from 'src/services/whatsapp/wa360dialog/wa360dialog.service';
import { Wa360dialogNotificationsConsumer } from 'src/jobs/consumers/notifications/wa360dialog-notifications.job.consumer';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification]),
    BullModule.registerQueue(smtpQueueConfig, mailgunQueueConfig, wa360DialogQueueConfig),
    HttpModule,
  ],
  providers: [
    NotificationQueueProducer,
    SmtpNotificationConsumer,
    MailgunNotificationConsumer,
    Wa360dialogNotificationsConsumer,
    NotificationsService,
    SmtpService,
    MailgunService,
    Wa360dialogService,
    ConfigService,
    JsendFormatter,
    Logger,
  ],
  exports: [NotificationsService],
  controllers: [NotificationsController],
})
export class NotificationsModule {}
