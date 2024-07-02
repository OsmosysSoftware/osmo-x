import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationsService } from 'src/modules/notifications/notifications.service';
import { Notification } from 'src/modules/notifications/entities/notification.entity';
import { NotificationConsumer } from './notification.consumer';
import {
  SmsTwilioData,
  SmsTwilioService,
} from 'src/modules/providers/sms-twilio/sms-twilio.service';
import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SmsTwilioNotificationsConsumer extends NotificationConsumer {
  constructor(
    @InjectRepository(Notification)
    protected readonly notificationRepository: Repository<Notification>,
    private readonly smsTwilioService: SmsTwilioService,
    @Inject(forwardRef(() => NotificationsService))
    notificationsService: NotificationsService,
    configService: ConfigService,
  ) {
    super(notificationRepository, notificationsService, configService);
  }

  async processSmsTwilioNotificationQueue(id: number): Promise<void> {
    return super.processNotificationQueue(id, async () => {
      const notification = (await this.notificationsService.getNotificationById(id))[0];
      return this.smsTwilioService.sendMessage(
        notification.data as unknown as SmsTwilioData,
        notification.providerId,
      );
    });
  }
}
