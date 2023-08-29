import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Notification } from 'src/models/notifications/entities/notification.entity';

@Injectable()
export class NotificationQueueProducer {
  constructor(@InjectQueue('smtpNotifications') private readonly smtpQueue: Queue) {}

  async addNotificationToQueue(notification: Notification[]): Promise<void> {
    await this.smtpQueue.add(notification);
  }
}
