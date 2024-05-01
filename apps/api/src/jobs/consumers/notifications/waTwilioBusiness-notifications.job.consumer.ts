import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationsService } from 'src/modules/notifications/notifications.service';
import { Notification } from 'src/modules/notifications/entities/notification.entity';
import { NotificationConsumer } from './notification.consumer';
import { WA_TWILIO_BUSINESS_QUEUE } from 'src/modules/notifications/queues/waTwilioBusiness.queue';
import {
  WaTwilioBusinessData,
  WaTwilioBusinessService,
} from 'src/modules/providers/wa-twilio-business/wa-twilio-business.service';

@Processor(WA_TWILIO_BUSINESS_QUEUE)
export class WaTwilioBusinessNotificationsConsumer extends NotificationConsumer {
  constructor(
    @InjectRepository(Notification)
    protected readonly notificationRepository: Repository<Notification>,
    private readonly waTwilioBusinessService: WaTwilioBusinessService,
    notificationsService: NotificationsService,
  ) {
    super(notificationRepository, notificationsService);
  }

  @Process()
  async processWaTwilioBusinessNotificationQueue(job: Job<number>): Promise<void> {
    return super.processNotificationQueue(job, async () => {
      const id = job.data;
      const notification = (await this.notificationsService.getNotificationById(id))[0];
      return this.waTwilioBusinessService.sendMessage(
        notification.data as unknown as WaTwilioBusinessData,
        notification.providerId,
      );
    });
  }
}
