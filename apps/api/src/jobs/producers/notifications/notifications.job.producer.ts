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

  async addNotificationToQueue(notification: Notification): Promise<void> {
    const provider = await this.providersService.getById(notification.providerId);
    const queue = this.queueService.getOrCreateQueue(notification.channelType, provider.name);
    await queue.add(notification.id);
  }
}
