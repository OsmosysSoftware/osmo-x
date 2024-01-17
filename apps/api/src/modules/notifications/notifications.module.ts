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

import { ScheduleService } from './schedule/schedule.service';
import { NotificationsResolver } from './notifications.resolver';
import { waTwilioQueueConfig } from './queues/waTwilio.queue';
import { WaTwilioNotificationsConsumer } from 'src/jobs/consumers/notifications/waTwilio-notifications.job.consumer';

@Module({})
export class NotificationsModule {
  static register(): DynamicModule {
    const configService = new ConfigService();
    const logger = new Logger(NotificationsModule.name);
    const modulesToLoad = [];
    const queuesToLoad = [];
    const consumersToLoad = [];

    if (configService.get<string>('ENABLE_SMTP') === 'true') {
      modulesToLoad.push(SmtpModule);
      queuesToLoad.push(smtpQueueConfig);
      consumersToLoad.push(SmtpNotificationConsumer);
    }

    if (configService.get<string>('ENABLE_MAILGUN') === 'true') {
      modulesToLoad.push(MailgunModule);
      queuesToLoad.push(mailgunQueueConfig);
      consumersToLoad.push(MailgunNotificationConsumer);
    }

    if (configService.get<string>('ENABLE_WA360DIALOG') === 'true') {
      modulesToLoad.push(Wa360dialogModule);
      queuesToLoad.push(wa360DialogQueueConfig);
      consumersToLoad.push(Wa360dialogNotificationsConsumer);
    }

    if (configService.get<string>('ENABLE_WA_TWILIO') === 'true') {
      modulesToLoad.push(WaTwilioModule);
      queuesToLoad.push(waTwilioQueueConfig);
      consumersToLoad.push(WaTwilioNotificationsConsumer);
    }

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
      ],
      exports: [NotificationsService],
      controllers: [NotificationsController],
    };
  }
}
