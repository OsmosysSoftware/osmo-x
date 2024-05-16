import { Injectable, Logger, Optional } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Notification } from 'src/modules/notifications/entities/notification.entity';
import { SMTP_QUEUE } from 'src/modules/notifications/queues/smtp.queue';
import { ChannelType } from 'src/common/constants/notifications';
import { WA360DIALOG_QUEUE } from 'src/modules/notifications/queues/wa360dialog.queue';
import { MAILGUN_QUEUE } from 'src/modules/notifications/queues/mailgun.queue';
import { WA_TWILIO_QUEUE } from 'src/modules/notifications/queues/waTwilio.queue';
import { SMS_TWILIO_QUEUE } from 'src/modules/notifications/queues/smsTwilio.queue';
import { SMS_PLIVO_QUEUE } from 'src/modules/notifications/queues/smsPlivo.queue';
import { WA_TWILIO_BUSINESS_QUEUE } from 'src/modules/notifications/queues/waTwilioBusiness.queue';
import { SMS_KAPSYSTEM_QUEUE } from 'src/modules/notifications/queues/smsKapsystem.queue';

@Injectable()
export class NotificationQueueProducer {
  private readonly logger = new Logger(NotificationQueueProducer.name);

  constructor(
    @Optional() @InjectQueue(SMTP_QUEUE) private readonly smtpQueue: Queue,
    @Optional() @InjectQueue(MAILGUN_QUEUE) private readonly mailgunQueue: Queue,
    @Optional() @InjectQueue(WA360DIALOG_QUEUE) private readonly wa360DialogQueue: Queue,
    @Optional() @InjectQueue(WA_TWILIO_QUEUE) private readonly waTwilioQueue: Queue,
    @Optional() @InjectQueue(SMS_TWILIO_QUEUE) private readonly smsTwilioQueue: Queue,
    @Optional() @InjectQueue(SMS_PLIVO_QUEUE) private readonly smsPlivoQueue: Queue,
    @Optional() @InjectQueue(SMS_KAPSYSTEM_QUEUE) private readonly smsKapsystemQueue: Queue,
    @Optional()
    @InjectQueue(WA_TWILIO_BUSINESS_QUEUE)
    private readonly waTwilioBusinessQueue: Queue,
  ) {}

  private listenForError(queue: Queue[]): void {
    if (queue) {
      queue[0].client.on('error', (error) => {
        this.logger.error('Redis connection error:');
        this.logger.error(JSON.stringify(error, ['message', 'stack', 2]));
      });
    }
  }

  async onModuleInit(): Promise<void> {
    const queues = [
      this.smtpQueue,
      this.mailgunQueue,
      this.wa360DialogQueue,
      this.waTwilioQueue,
      this.smsTwilioQueue,
      this.smsPlivoQueue,
      this.waTwilioBusinessQueue,
    ].filter((q) => q);
    this.listenForError(queues);
  }

  async addNotificationToQueue(notification: Notification): Promise<void> {
    switch (notification.channelType) {
      case ChannelType.SMTP:
        if (this.smtpQueue) {
          await this.smtpQueue.add(notification.id);
        }

        break;
      case ChannelType.MAILGUN:
        if (this.mailgunQueue) {
          await this.mailgunQueue.add(notification.id);
        }

        break;
      case ChannelType.WA_360_DAILOG:
        if (this.wa360DialogQueue) {
          await this.wa360DialogQueue.add(notification.id);
        }

        break;
      case ChannelType.WA_TWILIO:
        if (this.waTwilioQueue) {
          await this.waTwilioQueue.add(notification.id);
        }

        break;
      case ChannelType.SMS_TWILIO:
        if (this.smsTwilioQueue) {
          await this.smsTwilioQueue.add(notification.id);
        }

        break;
      case ChannelType.SMS_PLIVO:
        if (this.smsPlivoQueue) {
          await this.smsPlivoQueue.add(notification.id);
        }

        break;

      case ChannelType.WA_TWILIO_BUSINESS:
        if (this.waTwilioBusinessQueue) {
          await this.waTwilioBusinessQueue.add(notification.id);
        }

        break;

      case ChannelType.SMS_KAPSYSTEM:
        if (this.smsKapsystemQueue) {
          await this.smsKapsystemQueue.add(notification.id);
        }
        break;
    }
  }
}
