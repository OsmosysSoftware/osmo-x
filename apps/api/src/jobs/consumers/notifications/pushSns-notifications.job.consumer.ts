import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationsService } from 'src/modules/notifications/notifications.service';
import { Notification } from 'src/modules/notifications/entities/notification.entity';
import { NotificationConsumer } from './notification.consumer';
import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PushSnsData, PushSnsService } from 'src/modules/providers/push-sns/push-sns.service';

@Injectable()
export class PushSnsNotificationConsumer extends NotificationConsumer {
  constructor(
    @InjectRepository(Notification)
    protected readonly notificationRepository: Repository<Notification>,
    private readonly pushSnsService: PushSnsService,
    @Inject(forwardRef(() => NotificationsService))
    notificationsService: NotificationsService,
    configService: ConfigService,
  ) {
    super(notificationRepository, notificationsService, configService);
  }

  async processPushSnsNotificationQueue(id: number): Promise<void> {
    return super.processNotificationQueue(id, async () => {
      const notification = (await this.notificationsService.getNotificationById(id))[0];
      return this.pushSnsService.sendPushNotification(
        notification.data as unknown as PushSnsData,
        notification.providerId,
      );
    });
  }
}
