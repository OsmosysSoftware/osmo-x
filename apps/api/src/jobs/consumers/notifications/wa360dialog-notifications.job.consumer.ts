import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationsService } from 'src/modules/notifications/notifications.service';
import {
  Wa360DialogData,
  Wa360dialogService,
} from 'src/modules/providers/wa360dialog/wa360dialog.service';
import { Notification } from 'src/modules/notifications/entities/notification.entity';
import { NotificationConsumer } from './notification.consumer';
import { Inject, Injectable, forwardRef } from '@nestjs/common';

@Injectable()
export class Wa360dialogNotificationsConsumer extends NotificationConsumer {
  constructor(
    @InjectRepository(Notification)
    protected readonly notificationRepository: Repository<Notification>,
    private readonly wa360dialogService: Wa360dialogService,
    @Inject(forwardRef(() => NotificationsService))
    notificationsService: NotificationsService,
  ) {
    super(notificationRepository, notificationsService);
  }

  async processWa360dialogNotificationQueue(id: number): Promise<void> {
    return super.processNotificationQueue(id, async () => {
      const notification = (await this.notificationsService.getNotificationById(id))[0];
      return this.wa360dialogService.sendMessage(
        notification.data as unknown as Wa360DialogData,
        notification.providerId,
      );
    });
  }
}
