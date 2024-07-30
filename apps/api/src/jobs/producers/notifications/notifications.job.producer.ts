import { Injectable, Logger } from '@nestjs/common';
import { Notification } from 'src/modules/notifications/entities/notification.entity';
import { QueueService } from 'src/modules/notifications/queues/queue.service';
import { ProvidersService } from 'src/modules/providers/providers.service';

@Injectable()
export class NotificationQueueProducer {
  private readonly logger = new Logger(NotificationQueueProducer.name);

  constructor(
    private readonly queueService: QueueService,
    private readonly providersService: ProvidersService,
  ) {}

  async addNotificationToQueue(queueType: string, notification: Notification): Promise<void> {
    this.logger.debug('Started addNotificationToQueue');
    const provider = await this.providersService.getById(notification.providerId);
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
}
