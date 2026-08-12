import { Inject, Injectable, Logger } from '@nestjs/common';
import { Notification } from 'src/modules/notifications/entities/notification.entity';
import { IQueueService, QUEUE_SERVICE } from 'src/modules/notifications/queues/queue.tokens';
import { ProvidersService } from 'src/modules/providers/providers.service';
import { QueueAction } from 'src/common/constants/notifications';

@Injectable()
export class NotificationQueueProducer {
  private readonly logger = new Logger(NotificationQueueProducer.name);

  constructor(
    @Inject(QUEUE_SERVICE) private readonly queueService: IQueueService,
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
    const jobId = `${notification.id}-attempt-${attempt}`;

    this.logger.debug(
      `Scheduling delayed webhook retry for notification ${notification.id}, attempt ${attempt}, delay ${delayMs}ms`,
    );
    await queue.add(
      jobId,
      { id: notification.id, providerId: notification.providerId, attempt },
      { delay: delayMs, jobId },
    );
  }
}
