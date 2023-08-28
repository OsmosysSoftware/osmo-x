import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class NotificationQueueService {
  constructor(
    @InjectQueue('emailNotifications') private readonly emailQueue: Queue,
  ) {}

  async addNotificationToQueue(notification: any) {
    await this.emailQueue.add(notification);
  }
}
