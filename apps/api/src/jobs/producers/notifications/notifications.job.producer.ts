import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { Notification } from 'src/modules/notifications/entities/notification.entity';
import { IQueueService, QUEUE_SERVICE } from 'src/modules/notifications/queues/queue.tokens';
import { ProvidersService } from 'src/modules/providers/providers.service';
import { QueueAction } from 'src/common/constants/notifications';

@Injectable()
export class NotificationQueueProducer {
  private readonly logger = new Logger(NotificationQueueProducer.name);

  constructor(
    @Inject(QUEUE_SERVICE) private readonly queueService: IQueueService,
    @Inject(forwardRef(() => ProvidersService))
    private readonly providersService: ProvidersService,
  ) {}

  async addNotificationToQueue(queueType: string, notification: Notification): Promise<void> {
    this.logger.debug('Started addNotificationToQueue');
    const provider = await this.providersService.getById(notification.providerId);

    if (!provider) {
      throw new Error(`Provider with ID ${notification.providerId} not found.`);
    }

    this.logger.debug(
      `Fetched provider ${JSON.stringify(provider)} from notification ${JSON.stringify(notification)}`,
    );
    const queue = this.queueService.getOrCreateQueue(
      queueType,
      provider.channelType.toString(),
      notification.providerId.toString(),
    );
    this.logger.debug(`Adding notification with id ${notification.id} to queue`);
    await queue.add(notification.id.toString(), {
      id: notification.id,
      providerId: notification.providerId,
    });
  }

  async enqueueDelayedWebhookRetry(
    notification: Notification,
    attempt: number,
    delayMs: number,
  ): Promise<void> {
    const provider = await this.providersService.getById(notification.providerId);

    if (!provider) {
      throw new Error(`Provider with ID ${notification.providerId} not found.`);
    }

    const queue = this.queueService.getOrCreateQueue(
      QueueAction.WEBHOOK,
      provider.channelType.toString(),
      notification.providerId.toString(),
    );
    // Discriminate by updatedOn so ids stay stable across the retries of one delivery run (the
    // notification isn't re-saved while retries run) but differ across a re-triggered run.
    // Without it, BullMQ silently ignores an add whose jobId is still in Redis from a prior run.
    const updatedOnMs = notification.updatedOn
      ? new Date(notification.updatedOn).getTime()
      : Number.NaN;
    const runId = Number.isNaN(updatedOnMs) ? Date.now() : updatedOnMs;
    const jobId = `${notification.id}-${runId}-attempt-${attempt}`;

    this.logger.debug(
      `Scheduling delayed webhook retry for notification ${notification.id}, attempt ${attempt}, delay ${delayMs}ms`,
    );

    const existing = await queue.getJob(jobId);

    if (existing) {
      this.logger.warn(
        `Webhook retry job ${jobId} already exists in Redis; BullMQ will ignore this add and the retry may be swallowed.`,
      );
    }

    await queue.add(
      jobId,
      { id: notification.id, providerId: notification.providerId, attempt },
      { delay: delayMs, jobId },
    );
  }
}
