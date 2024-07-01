import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationsService } from 'src/modules/notifications/notifications.service';
import { Notification } from 'src/modules/notifications/entities/notification.entity';
import { NotificationConsumer } from './notification.consumer';
import { SmsPlivoData, SmsPlivoService } from 'src/modules/providers/sms-plivo/sms-plivo.service';
import { Inject, Injectable, forwardRef } from '@nestjs/common';

@Injectable()
export class SmsPlivoNotificationsConsumer extends NotificationConsumer {
  constructor(
    @InjectRepository(Notification)
    protected readonly notificationRepository: Repository<Notification>,
    private readonly smsPlivoService: SmsPlivoService,
    @Inject(forwardRef(() => NotificationsService))
    notificationsService: NotificationsService,
  ) {
    super(notificationRepository, notificationsService);
  }

  async processSmsPlivoNotificationQueue(id: number): Promise<void> {
    return super.processNotificationQueue(id, async () => {
      const notification = (await this.notificationsService.getNotificationById(id))[0];
      return this.smsPlivoService.sendMessage(
        notification.data as unknown as SmsPlivoData,
        notification.providerId,
      );
    });
  }
}
