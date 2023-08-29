import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class NotificationQueueProducer {
  constructor(
    @InjectQueue('smtpNotifications') private readonly smtpQueue: Queue,
  ) {}

  async addNotificationToQueue(notification: any) {
    await this.smtpQueue.add(notification);
  }
}
