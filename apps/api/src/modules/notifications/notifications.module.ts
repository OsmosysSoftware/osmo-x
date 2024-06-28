import { Module, Logger, DynamicModule } from '@nestjs/common';
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
import { SmsPlivoNotificationsConsumer } from 'src/jobs/consumers/notifications/smsPlivo-notifications.job.consumer';
import { WaTwilioBusinessModule } from '../providers/wa-twilio-business/wa-twilio-business.module';
import { WaTwilioBusinessNotificationsConsumer } from 'src/jobs/consumers/notifications/waTwilioBusiness-notifications.job.consumer';
import { SmsKapsystemModule } from '../providers/sms-kapsystem/sms-kapsystem.module';
import { SmsKapsystemNotificationsConsumer } from 'src/jobs/consumers/notifications/smsKapsystem-notifications.job.consumer';
import { QueueService } from './queues/queue.service';

@Module({})
export class NotificationsModule {
  static register(): DynamicModule {
    const logger = new Logger(NotificationsModule.name);
    const modulesToLoad = [];
    const consumersToLoad = [];

    // Load SMTP
    modulesToLoad.push(SmtpModule);
    consumersToLoad.push(SmtpNotificationConsumer);

    // Load MAILGUN
    modulesToLoad.push(MailgunModule);
    consumersToLoad.push(MailgunNotificationConsumer);

    // Load WA360DIALOG
    modulesToLoad.push(Wa360dialogModule);
    consumersToLoad.push(Wa360dialogNotificationsConsumer);

    // Load WA_TWILIO
    modulesToLoad.push(WaTwilioModule);
    consumersToLoad.push(WaTwilioNotificationsConsumer);

    // Load SMS_TWILIO
    modulesToLoad.push(SmsTwilioModule);
    consumersToLoad.push(SmsTwilioNotificationsConsumer);

    // Load SMS_PLIVO
    modulesToLoad.push(SmsPlivoModule);
    consumersToLoad.push(SmsPlivoNotificationsConsumer);

    // Load WA_TWILIO_BUSINESS
    modulesToLoad.push(WaTwilioBusinessModule);
    consumersToLoad.push(WaTwilioBusinessNotificationsConsumer);

    // Load SMS_KAPSYSTEM
    modulesToLoad.push(SmsKapsystemModule);
    consumersToLoad.push(SmsKapsystemNotificationsConsumer);

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
        QueueService,
      ],
      exports: [
        ...consumersToLoad,
        NotificationsService,
        ServerApiKeysService,
        ApplicationsService,
        UsersService,
        ProvidersService,
        QueueService,
      ],
      controllers: [NotificationsController],
    };
  }
}
