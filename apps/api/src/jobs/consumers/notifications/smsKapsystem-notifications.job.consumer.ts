import { NotificationConsumer } from './notification.consumer';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  KapsystemData,
  SmsKapsystemService,
} from 'src/modules/providers/sms-kapsystem/sms-kapsystem.service';
import { NotificationsService } from 'src/modules/notifications/notifications.service';
import { Notification } from 'src/modules/notifications/entities/notification.entity';
import { Inject, Injectable, forwardRef } from '@nestjs/common';

@Injectable()
export class SmsKapsystemNotificationsConsumer extends NotificationConsumer {
  constructor(
    @InjectRepository(Notification)
    protected readonly notificationRepository: Repository<Notification>,
    private readonly kapsystemService: SmsKapsystemService,
    @Inject(forwardRef(() => NotificationsService))
    notificationsService: NotificationsService,
  ) {
    super(notificationRepository, notificationsService);
  }

  async processSmsKapsystemNotificationQueue(id: number): Promise<void> {
    return super.processNotificationQueue(id, async () => {
      const notification = (await this.notificationsService.getNotificationById(id))[0];
      return this.kapsystemService.sendMessage(
        notification.data as unknown as KapsystemData,
        notification.providerId,
      );
    });
  }
}
