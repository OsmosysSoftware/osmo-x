import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue, Worker, QueueEvents } from 'bullmq';
import ms = require('ms');
import { ChannelType, QueueAction } from 'src/common/constants/notifications';
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
  private workers: Map<string, Worker> = new Map();
  private queueEvents: Map<string, QueueEvents> = new Map();
  private redisConfig: { host: string; port: number };
  private idleTimeout: number;
  private cleanupInterval: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly smtpNotificationConsumer: SmtpNotificationConsumer,
    private readonly mailgunNotificationConsumer: MailgunNotificationConsumer,
    private readonly wa360dialogNotificationConsumer: Wa360dialogNotificationsConsumer,
    private readonly waTwilioNotificationConsumer: WaTwilioNotificationsConsumer,
    private readonly smsTwilioNotificationConsumer: SmsTwilioNotificationsConsumer,
    private readonly smsPlivoNotificationConsumer: SmsPlivoNotificationsConsumer,
    private readonly waTwilioBusinessNotificationConsumer: WaTwilioBusinessNotificationsConsumer,
    private readonly smsKapsystemNotificationConsumer: SmsKapsystemNotificationsConsumer,
  ) {
    this.redisConfig = {
      host: this.configService.get<string>('REDIS_HOST'),
      port: this.configService.get<number>('REDIS_PORT'),
    };

    if (this.configService.get('CLEANUP_IDLE_RESOURCES', 'false') === 'true') {
      this.idleTimeout = ms(this.configService.get<string>('IDLE_TIMEOUT', '30m'));
      this.cleanupInterval = ms(this.configService.get<string>('CLEANUP_INTERVAL', '7d'));
      this.startCleanupTask();
    }
  }

  private createQueue(queueName: string): Queue {
    const queue = new Queue(queueName, { connection: this.redisConfig });

    queue.on('error', (error) => {
      this.logger.error(`Redis connection error in queue ${queueName}:`, error);
    });

    this.queues.set(queueName, queue);

    // Create QueueEvents for handling stalled jobs
    const queueEvents = new QueueEvents(queueName, { connection: this.redisConfig });
    queueEvents.on('stalled', async (jobId) => {
      this.logger.warn(`Job stalled in queue ${queueName}, jobId: ${jobId}`);
      // TODO: Handle stalled job, e.g., retry the job or move to a failed queue
    });

    this.queueEvents.set(queueName, queueEvents);

    return queue;
  }

  getOrCreateQueue(action: string, providerType: string, providerId: string): Queue {
    const queueName = `${action}-${providerType}-${providerId}`;

    if (!this.queues.has(queueName)) {
      this.logger.log(`Creating new queue and worker for ${queueName}`);
      this.createQueue(queueName);
      this.createWorker(action, providerType, queueName);
    }

    return this.queues.get(queueName);
  }

  private createWorker(action: string, providerType: string, queueName: string): void {
    const processJob = async (job): Promise<void> => {
      switch (`${action}-${providerType}`) {
        case `${QueueAction.SEND}-${ChannelType.SMTP}`:
          await this.smtpNotificationConsumer.processSmtpNotificationQueue(job.data.id);
          break;
        case `${QueueAction.SEND}-${ChannelType.MAILGUN}`:
          await this.mailgunNotificationConsumer.processMailgunNotificationQueue(job.data.id);
          break;
        case `${QueueAction.SEND}-${ChannelType.WA_360_DAILOG}`:
          await this.wa360dialogNotificationConsumer.processWa360dialogNotificationQueue(
            job.data.id,
          );
          break;
        // WA_TWILIO cases
        case `${QueueAction.SEND}-${ChannelType.WA_TWILIO}`:
          await this.waTwilioNotificationConsumer.processWaTwilioNotificationQueue(job.data.id);
          break;
        case `${QueueAction.DELIVERY_STATUS}-${ChannelType.WA_TWILIO}`:
          await this.waTwilioNotificationConsumer.processWaTwilioNotificationConfirmationQueue(
            job.data.id,
          );
          break;
        case `${QueueAction.SEND}-${ChannelType.SMS_TWILIO}`:
          await this.smsTwilioNotificationConsumer.processSmsTwilioNotificationQueue(job.data.id);
          break;
        case `${QueueAction.SEND}-${ChannelType.SMS_PLIVO}`:
          await this.smsPlivoNotificationConsumer.processSmsPlivoNotificationQueue(job.data.id);
          break;
        // WA_TWILIO_BUSINESS cases
        case `${QueueAction.SEND}-${ChannelType.WA_TWILIO_BUSINESS}`:
          await this.waTwilioBusinessNotificationConsumer.processWaTwilioBusinessNotificationQueue(
            job.data.id,
          );
          break;
        case `${QueueAction.DELIVERY_STATUS}-${ChannelType.WA_TWILIO_BUSINESS}`:
          await this.waTwilioBusinessNotificationConsumer.processWaTwilioBusinessNotificationConfirmationQueue(
            job.data.id,
          );
          break;
        case `${QueueAction.SEND}-${ChannelType.SMS_KAPSYSTEM}`:
          await this.smsKapsystemNotificationConsumer.processSmsKapsystemNotificationQueue(
            job.data.id,
          );
          break;
        default:
          this.logger.error(
            `Unsupported action-providerType combination: ${action}-${providerType}`,
          );
          return;
      }
    };

    const worker = new Worker(queueName, processJob, { connection: this.redisConfig });
    worker.on('completed', (job) => {
      this.logger.log(JSON.stringify(job));
      this.logger.log(`Job completed: ${job.id}`);
    });
    worker.on('failed', (job, err) => {
      this.logger.log(JSON.stringify(job));
      this.logger.error(`Job failed: ${job.id}`, err);
    });

    this.workers.set(queueName, worker);
  }

  private startCleanupTask(): void {
    setInterval(() => {
      this.cleanupIdleResources();
    }, this.cleanupInterval);
  }

  private async cleanupIdleResources(): Promise<void> {
    const now = Date.now();

    for (const [queueName, queue] of this.queues.entries()) {
      const lastActivity = await queue.getJobs(['active', 'waiting', 'delayed']);

      if (lastActivity.length === 0) {
        const lastCompleted = await queue.getJobCounts('completed');
        const lastFailed = await queue.getJobCounts('failed');

        const lastJobTime = Math.max(lastCompleted.completed || 0, lastFailed.failed || 0);

        if (now - lastJobTime > this.idleTimeout) {
          this.logger.log(`Removing idle queue and worker: ${queueName}`);
          this.removeWorkerAndQueue(queueName);
        }
      }
    }
  }

  private async removeWorkerAndQueue(queueName: string): Promise<void> {
    if (this.workers.has(queueName)) {
      await this.workers.get(queueName).close();
      this.workers.delete(queueName);
      this.logger.log(`Worker removed for queue: ${queueName} due to inactivity.`);
    }

    if (this.queues.has(queueName)) {
      await this.queues.get(queueName).close();
      this.queues.delete(queueName);
      this.logger.log(`Queue removed: ${queueName} due to inactivity.`);
    }

    if (this.queueEvents.has(queueName)) {
      await this.queueEvents.get(queueName).close();
      this.queueEvents.delete(queueName);
      this.logger.log(`Queue events removed: ${queueName} due to inactivity.`);
    }
  }
}
