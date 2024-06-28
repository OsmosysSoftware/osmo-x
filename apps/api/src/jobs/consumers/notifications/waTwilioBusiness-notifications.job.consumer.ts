import { Job } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationsService } from 'src/modules/notifications/notifications.service';
import { Notification } from 'src/modules/notifications/entities/notification.entity';
import { NotificationConsumer } from './notification.consumer';
import {
  WaTwilioBusinessData,
  WaTwilioBusinessService,
} from 'src/modules/providers/wa-twilio-business/wa-twilio-business.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class WaTwilioBusinessNotificationsConsumer extends NotificationConsumer {
  constructor(
    @InjectRepository(Notification)
    protected readonly notificationRepository: Repository<Notification>,
    private readonly waTwilioBusinessService: WaTwilioBusinessService,
    notificationsService: NotificationsService,
  ) {
    super(notificationRepository, notificationsService);
  }

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
