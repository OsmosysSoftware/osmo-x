import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue, QueueOptions } from 'bull';
import * as Bull from 'bull';
import { Worker, Job } from 'bullmq';
import { ChannelType } from 'src/common/constants/notifications';
import { MailgunNotificationConsumer } from 'src/jobs/consumers/notifications/mailgun-notifications.job.consumer';
import { SmsKapsystemNotificationsConsumer } from 'src/jobs/consumers/notifications/smsKapsystem-notifications.job.consumer';
import { SmsPlivoNotificationsConsumer } from 'src/jobs/consumers/notifications/smsPlivo-notifications.job.consumer';
import { SmsTwilioNotificationsConsumer } from 'src/jobs/consumers/notifications/smsTwilio-notifications.job.consumer';
import { SmtpNotificationConsumer } from 'src/jobs/consumers/notifications/smtp-notifications.job.consumer';
import { Wa360dialogNotificationsConsumer } from 'src/jobs/consumers/notifications/wa360dialog-notifications.job.consumer';
import { WaTwilioNotificationsConsumer } from 'src/jobs/consumers/notifications/waTwilio-notifications.job.consumer';
import { WaTwilioBusinessNotificationsConsumer } from 'src/jobs/consumers/notifications/waTwilioBusiness-notifications.job.consumer';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);
  private queues: Map<string, Queue> = new Map();
  private redisConfig: QueueOptions['redis'];

  constructor(
    private readonly configService: ConfigService,
    private readonly smtpNotificationConsumer: SmtpNotificationConsumer,
    private readonly mailgunNotificationConsumer: MailgunNotificationConsumer,
    private readonly wa360dialogNotificationConsumer: Wa360dialogNotificationsConsumer,
    private readonly waTwilioNotificationConsumer: WaTwilioNotificationsConsumer,
    private readonly smsTwilioNotificationConsumer: SmsTwilioNotificationsConsumer,
    private readonly smsPlivoNotificationConsumer: SmsPlivoNotificationsConsumer,
    private readonly waTwilioBusinessNotificationConsumer: WaTwilioBusinessNotificationsConsumer,
    private readonly smsKapssytemNotificationConsumer: SmsKapsystemNotificationsConsumer,
  ) {
    this.redisConfig = {
      host: this.configService.get<string>('REDIS_HOST'),
      port: this.configService.get<number>('REDIS_PORT'),
    };
  }

  private createQueue(queueName: string): Queue {
    const queue = new Bull(queueName, { redis: this.redisConfig });

    queue.on('error', (error) => {
      this.logger.error(`Redis connection error in queue ${queueName}:`);
      this.logger.error(JSON.stringify(error, ['message', 'stack'], 2));
    });

    this.queues.set(queueName, queue);
    return queue;
  }

  getOrCreateQueue(channelType: number, provider: string): Queue {
    const queueName = `${channelType}_${provider}`;

    if (!this.queues.has(queueName)) {
      this.logger.log('Creating new queue and worker for ' + queueName);
      this.createWorker(channelType, queueName);
      return this.createQueue(queueName);
    }

    return this.queues.get(queueName);
  }

  createWorker(channelType: number, queueName: string): void {
    switch (channelType) {
      case ChannelType.SMTP:
        new Worker(queueName, async (job: Job<number>) => {
          this.smtpNotificationConsumer.processSmtpNotificationQueue(job);
        });
      case ChannelType.MAILGUN:
        new Worker(queueName, async (job: Job<number>) => {
          this.mailgunNotificationConsumer.processMailgunNotificationQueue(job);
        });
      case ChannelType.WA_360_DAILOG:
        new Worker(queueName, async (job: Job<number>) => {
          this.wa360dialogNotificationConsumer.processWa360dialogNotificationQueue(job);
        });
      case ChannelType.WA_TWILIO:
        new Worker(queueName, async (job: Job<number>) => {
          this.waTwilioNotificationConsumer.processWaTwilioNotificationQueue(job);
        });
      case ChannelType.SMS_TWILIO:
        new Worker(queueName, async (job: Job<number>) => {
          this.smsTwilioNotificationConsumer.processSmsTwilioNotificationQueue(job);
        });
      case ChannelType.SMS_PLIVO:
        new Worker(queueName, async (job: Job<number>) => {
          this.smsPlivoNotificationConsumer.processSmsPlivoNotificationQueue(job);
        });
      case ChannelType.WA_TWILIO_BUSINESS:
        new Worker(queueName, async (job: Job<number>) => {
          this.waTwilioBusinessNotificationConsumer.processWaTwilioBusinessNotificationQueue(job);
        });
      case ChannelType.SMS_KAPSYSTEM:
        new Worker(queueName, async (job: Job<number>) => {
          this.smsKapssytemNotificationConsumer.processSmsKapsystemNotificationQueue(job);
        });
    }
  }
}
