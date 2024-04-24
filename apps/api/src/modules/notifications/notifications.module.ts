import { Module, Logger, DynamicModule } from '@nestjs/common';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
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
import { Repository } from 'typeorm';
import { Provider } from '../providers/entities/provider.entity';
import { ChannelType } from 'src/common/constants/notifications';

@Module({})
export class NotificationsModule {
  private static providerRepository: Repository<Provider>;
  constructor(
    @InjectRepository(Provider)
    _providerRepository: Repository<Provider>,
  ) {
    NotificationsModule.providerRepository = _providerRepository;
  }

  async onModuleInit(): Promise<void> {
    await NotificationsModule.register();
  }

  static async getConfigById(providerId: number): Promise<Record<string, unknown> | null> {
    const configEntity = await NotificationsModule.providerRepository.findOne({
      where: { providerId },
    });

    if (configEntity) {
      return configEntity.configuration as unknown as Record<string, unknown>;
    }

    return null;
  }

  static async register(): Promise<DynamicModule> {
    const logger = new Logger(NotificationsModule.name);
    const modulesToLoad = [];
    const queuesToLoad = [];
    const consumersToLoad = [];

    // Get the config for all the providers. Add as per requirement
    const smtpConfig = await this.getConfigById(ChannelType.SMTP);
    const mailgunConfig = await NotificationsModule.getConfigById(ChannelType.MAILGUN);
    const wa360Config = await NotificationsModule.getConfigById(ChannelType.WA_360_DAILOG);
    const waTwilioConfig = await NotificationsModule.getConfigById(ChannelType.WA_TWILIO);
    const smsTwilioConfig = await NotificationsModule.getConfigById(ChannelType.SMS_TWILIO);

    if ((smtpConfig.ENABLE_SMTP as boolean) === true) {
      modulesToLoad.push(SmtpModule);
      queuesToLoad.push(smtpQueueConfig);
      consumersToLoad.push(SmtpNotificationConsumer);
    }

    if ((mailgunConfig.ENABLE_MAILGUN as boolean) === true) {
      modulesToLoad.push(MailgunModule);
      queuesToLoad.push(mailgunQueueConfig);
      consumersToLoad.push(MailgunNotificationConsumer);
    }

    if ((wa360Config.ENABLE_WA360DIALOG as boolean) === true) {
      modulesToLoad.push(Wa360dialogModule);
      queuesToLoad.push(wa360DialogQueueConfig);
      consumersToLoad.push(Wa360dialogNotificationsConsumer);
    }

    if ((waTwilioConfig.ENABLE_WA_TWILIO as boolean) === true) {
      modulesToLoad.push(WaTwilioModule);
      queuesToLoad.push(waTwilioQueueConfig);
      consumersToLoad.push(WaTwilioNotificationsConsumer);
    }

    if ((smsTwilioConfig.ENABLE_SMS_TWILIO as boolean) === true) {
      modulesToLoad.push(SmsTwilioModule);
      queuesToLoad.push(smsTwilioQueueConfig);
      consumersToLoad.push(SmsTwilioNotificationsConsumer);
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
