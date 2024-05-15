import { Module, Logger, DynamicModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { Notification } from './entities/notification.entity';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationQueueProducer } from 'src/jobs/producers/notifications/notifications.job.producer';
import { SmtpNotificationConsumer } from 'src/jobs/consumers/notifications/smtp-notifications.job.consumer';
import { ConfigService } from '@nestjs/config';
import { smtpQueueConfig } from './queues/smtp.queue';
import { mailgunQueueConfig } from './queues/mailgun.queue';
import { MailgunNotificationConsumer } from 'src/jobs/consumers/notifications/mailgun-notifications.job.consumer';
import { JsendFormatter } from 'src/common/jsend-formatter';
import { wa360DialogQueueConfig } from './queues/wa360dialog.queue';
import { Wa360dialogNotificationsConsumer } from 'src/jobs/consumers/notifications/wa360dialog-notifications.job.consumer';
import { MailgunModule } from '../providers/mailgun/mailgun.module';
import { SmtpModule } from '../providers/smtp/smtp.module';
import { Wa360dialogModule } from '../providers/wa360dialog/wa360dialog.module';
import { WaTwilioModule } from '../providers/wa-twilio/wa-twilio.module';
import { SmsTwilioModule } from '../providers/sms-twilio/sms-twilio.module';

import { ScheduleService } from './schedule/schedule.service';
import { NotificationsResolver } from './notifications.resolver';
import { waTwilioQueueConfig } from './queues/waTwilio.queue';
import { WaTwilioNotificationsConsumer } from 'src/jobs/consumers/notifications/waTwilio-notifications.job.consumer';
import { smsTwilioQueueConfig } from './queues/smsTwilio.queue';
import { SmsTwilioNotificationsConsumer } from 'src/jobs/consumers/notifications/smsTwilio-notifications.job.consumer';
// Import entity modules and services
import { ServerApiKeysModule } from '../server-api-keys/server-api-keys.module';
import { ServerApiKeysService } from '../server-api-keys/server-api-keys.service';
import { ApplicationsModule } from '../applications/applications.module';
import { ApplicationsService } from '../applications/applications.service';
import { UsersModule } from '../users/users.module';
import { UsersService } from '../users/users.service';
import { ProvidersModule } from '../providers/providers.module';
import { ProvidersService } from '../providers/providers.service';
import { SmsPlivoModule } from '../providers/sms-plivo/sms-plivo.module';
import { smsPlivoQueueConfig } from './queues/smsPlivo.queue';
import { SmsPlivoNotificationsConsumer } from 'src/jobs/consumers/notifications/smsPlivo-notifications.job.consumer';
import { WaTwilioBusinessModule } from '../providers/wa-twilio-business/wa-twilio-business.module';
import { waTwilioBusinessQueueConfig } from './queues/waTwilioBusiness.queue';
import { WaTwilioBusinessNotificationsConsumer } from 'src/jobs/consumers/notifications/waTwilioBusiness-notifications.job.consumer';
import { SmsKapsystemModule } from '../providers/sms-kapsystem/sms-kapsystem.module';
import { smsKapsystemQueueConfig } from './queues/smsKapsystem.queue';
import { KapsystemNotificationsConsumer } from 'src/jobs/consumers/notifications/kapsystem-notifications.job.consumer';

@Module({})
export class NotificationsModule {
  static register(): DynamicModule {
    const logger = new Logger(NotificationsModule.name);
    const modulesToLoad = [];
    const queuesToLoad = [];
    const consumersToLoad = [];

    // Load SMTP
    modulesToLoad.push(SmtpModule);
    queuesToLoad.push(smtpQueueConfig);
    consumersToLoad.push(SmtpNotificationConsumer);

    // Load MAILGUN
    modulesToLoad.push(MailgunModule);
    queuesToLoad.push(mailgunQueueConfig);
    consumersToLoad.push(MailgunNotificationConsumer);

    // Load WA360DIALOG
    modulesToLoad.push(Wa360dialogModule);
    queuesToLoad.push(wa360DialogQueueConfig);
    consumersToLoad.push(Wa360dialogNotificationsConsumer);

    // Load WA_TWILIO
    modulesToLoad.push(WaTwilioModule);
    queuesToLoad.push(waTwilioQueueConfig);
    consumersToLoad.push(WaTwilioNotificationsConsumer);

    // Load SMS_TWILIO
    modulesToLoad.push(SmsTwilioModule);
    queuesToLoad.push(smsTwilioQueueConfig);
    consumersToLoad.push(SmsTwilioNotificationsConsumer);

    // Load SMS_PLIVO
    modulesToLoad.push(SmsPlivoModule);
    queuesToLoad.push(smsPlivoQueueConfig);
    consumersToLoad.push(SmsPlivoNotificationsConsumer);

    // Load WA_TWILIO_BUSINESS
    modulesToLoad.push(WaTwilioBusinessModule);
    queuesToLoad.push(waTwilioBusinessQueueConfig);
    consumersToLoad.push(WaTwilioBusinessNotificationsConsumer);

    // Load SMS_KAPSYSTEM
    modulesToLoad.push(SmsKapsystemModule);
    queuesToLoad.push(smsKapsystemQueueConfig);
    consumersToLoad.push(KapsystemNotificationsConsumer);

    const serviceProviderModules: DynamicModule[] = modulesToLoad;

    if (serviceProviderModules.length === 0) {
      logger.error('At least one service provider should be enabled.');
      process.exit(1);
    }

    logger.log('Services Enabled: ' + serviceProviderModules.map((a) => a['name']).join(', '));
    return {
      module: NotificationsModule,
      imports: [
        TypeOrmModule.forFeature([Notification]),
        BullModule.registerQueue(...queuesToLoad),
        ...serviceProviderModules,
        ServerApiKeysModule,
        ApplicationsModule,
        UsersModule,
        ProvidersModule,
      ],
      providers: [
        NotificationQueueProducer,
        ...consumersToLoad,
        NotificationsService,
        ScheduleService,
        ConfigService,
        JsendFormatter,
        Logger,
        NotificationsResolver,
        ServerApiKeysService,
        ApplicationsService,
        UsersService,
        ProvidersService,
      ],
      exports: [
        NotificationsService,
        ServerApiKeysService,
        ApplicationsService,
        UsersService,
        ProvidersService,
      ],
      controllers: [NotificationsController],
    };
  }
}
