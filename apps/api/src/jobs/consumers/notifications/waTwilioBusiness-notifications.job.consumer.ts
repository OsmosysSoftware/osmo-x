import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationsService } from 'src/modules/notifications/notifications.service';
import { Notification } from 'src/modules/notifications/entities/notification.entity';
import { NotificationConsumer } from './notification.consumer';
import {
  WaTwilioBusinessData,
  WaTwilioBusinessService,
} from 'src/modules/providers/wa-twilio-business/wa-twilio-business.service';
import { Inject, Injectable, forwardRef } from '@nestjs/common';

@Injectable()
export class WaTwilioBusinessNotificationsConsumer extends NotificationConsumer {
  constructor(
    @InjectRepository(Notification)
    protected readonly notificationRepository: Repository<Notification>,
    private readonly waTwilioBusinessService: WaTwilioBusinessService,
    @Inject(forwardRef(() => NotificationsService))
    notificationsService: NotificationsService,
  ) {
    super(notificationRepository, notificationsService);
  }

  async processWaTwilioBusinessNotificationQueue(id: number): Promise<void> {
    return super.processNotificationQueue(id, async () => {
      const notification = (await this.notificationsService.getNotificationById(id))[0];
      return this.waTwilioBusinessService.sendMessage(
        notification.data as unknown as WaTwilioBusinessData,
        notification.providerId,
      );
    });
  }
}
