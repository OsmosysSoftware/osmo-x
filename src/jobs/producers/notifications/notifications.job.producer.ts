import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Notification } from 'src/modules/notifications/entities/notification.entity';
import { SMTP_QUEUE } from 'src/modules/notifications/queues/smtp.queue';
import { MAILGUN_QUEUE } from 'src/modules/notifications/queues/mailgun.queue';
import { ChannelType } from 'src/common/constants/notifications';

@Injectable()
export class NotificationQueueProducer {
  constructor(
    @InjectQueue(SMTP_QUEUE) private readonly smtpQueue: Queue,
    @InjectQueue(MAILGUN_QUEUE) private readonly mailgunQueue: Queue,
  ) {}
  private readonly logger = new Logger(NotificationQueueProducer.name);
  async onModuleInit(): Promise<void> {
    this.smtpQueue.client.on('error', (error) => {
      this.logger.error('Redis connection error:');
      this.logger.error(JSON.stringify(error, ['message', 'stack', 2]));
    });
    this.mailgunQueue.client.on('error', (error) => {
      this.logger.error('Redis connection error:');
      this.logger.error(JSON.stringify(error, ['message', 'stack', 2]));
    });
  }
  async addNotificationToQueue(notification: Notification): Promise<void> {
    switch (notification.channelType) {
      case ChannelType.SMTP:
        await this.smtpQueue.add(notification.id);
        break;
      case ChannelType.MAILGUN:
        await this.mailgunQueue.add(notification.id);
        break;
    }
  }
}
