import { Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationQueueProducer } from 'src/jobs/producers/notifications/notifications.job.producer';
import { SmtpNotificationConsumer } from 'src/jobs/consumers/notifications/smtp-notifications.job.consumer';
import { ConfigService } from '@nestjs/config';
import { MailgunNotificationConsumer } from 'src/jobs/consumers/notifications/mailgun-notifications.job.consumer';
import { JsendFormatter } from 'src/common/jsend-formatter';
import { Wa360dialogNotificationsConsumer } from 'src/jobs/consumers/notifications/wa360dialog-notifications.job.consumer';
import { MailgunModule } from '../providers/mailgun/mailgun.module';
import { SmtpModule } from '../providers/smtp/smtp.module';
import { Wa360dialogModule } from '../providers/wa360dialog/wa360dialog.module';
import { WaTwilioModule } from '../providers/wa-twilio/wa-twilio.module';
import { SmsTwilioModule } from '../providers/sms-twilio/sms-twilio.module';
import { ScheduleService } from './schedule/schedule.service';
import { NotificationsResolver } from './notifications.resolver';
import { WaTwilioNotificationsConsumer } from 'src/jobs/consumers/notifications/waTwilio-notifications.job.consumer';
import { SmsTwilioNotificationsConsumer } from 'src/jobs/consumers/notifications/smsTwilio-notifications.job.consumer';
import { ServerApiKeysModule } from '../server-api-keys/server-api-keys.module';
import { ServerApiKeysService } from '../server-api-keys/server-api-keys.service';
import { ApplicationsModule } from '../applications/applications.module';
import { ApplicationsService } from '../applications/applications.service';
import { UsersModule } from '../users/users.module';
import { UsersService } from '../users/users.service';
import { ProvidersModule } from '../providers/providers.module';
import { ProvidersService } from '../providers/providers.service';
import { SmsPlivoModule } from '../providers/sms-plivo/sms-plivo.module';
import { SmsPlivoNotificationsConsumer } from 'src/jobs/consumers/notifications/smsPlivo-notifications.job.consumer';
import { WaTwilioBusinessModule } from '../providers/wa-twilio-business/wa-twilio-business.module';
import { SmsKapsystemModule } from '../providers/sms-kapsystem/sms-kapsystem.module';
import { SmsKapsystemNotificationsConsumer } from 'src/jobs/consumers/notifications/smsKapsystem-notifications.job.consumer';
import { QueueService } from './queues/queue.service';
import { WaTwilioBusinessNotificationsConsumer } from 'src/jobs/consumers/notifications/waTwilioBusiness-notifications.job.consumer';
import { PushSnsNotificationConsumer } from 'src/jobs/consumers/notifications/pushSns-notifications.job.consumer';
import { PushSnsModule } from '../providers/push-sns/push-sns.module';
import { WebhookModule } from '../webhook/webhook.module';

const providerModules = [
  MailgunModule,
  SmtpModule,
  Wa360dialogModule,
  WaTwilioModule,
  SmsTwilioModule,
  SmsPlivoModule,
  WaTwilioBusinessModule,
  SmsKapsystemModule,
  PushSnsModule,
  ServerApiKeysModule,
  ApplicationsModule,
  UsersModule,
  ProvidersModule,
];

const consumers = [
  SmtpNotificationConsumer,
  MailgunNotificationConsumer,
  Wa360dialogNotificationsConsumer,
  WaTwilioNotificationsConsumer,
  SmsTwilioNotificationsConsumer,
  SmsPlivoNotificationsConsumer,
  WaTwilioBusinessNotificationsConsumer,
  SmsKapsystemNotificationsConsumer,
  PushSnsNotificationConsumer,
];

@Module({
  imports: [TypeOrmModule.forFeature([Notification]), ...providerModules, WebhookModule],
  providers: [
    NotificationsService,
    NotificationQueueProducer,
    ScheduleService,
    ConfigService,
    JsendFormatter,
    Logger,
    NotificationsResolver,
    ServerApiKeysService,
    ApplicationsService,
    UsersService,
    ProvidersService,
    QueueService,
    ...consumers,
  ],
  exports: [
    NotificationsService,
    ServerApiKeysService,
    ApplicationsService,
    UsersService,
    ProvidersService,
    QueueService,
    ...consumers,
  ],
  controllers: [NotificationsController],
})
export class NotificationsModule {}
