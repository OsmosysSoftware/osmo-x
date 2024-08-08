import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationsService } from 'src/modules/notifications/notifications.service';
import { Notification } from 'src/modules/notifications/entities/notification.entity';
import { NotificationConsumer } from './notification.consumer';
import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WebhookService } from 'src/modules/webhook/webhook.service';
import { SmsSnsData, SmsSnsService } from 'src/modules/providers/sms-sns/sms-sns.service';

@Injectable()
export class SmsSnsNotificationConsumer extends NotificationConsumer {
  constructor(
    @InjectRepository(Notification)
    protected readonly notificationRepository: Repository<Notification>,
    private readonly smsSnsService: SmsSnsService,
    @Inject(forwardRef(() => NotificationsService))
    notificationsService: NotificationsService,
    configService: ConfigService,
    webhookService: WebhookService,
  ) {
    super(notificationRepository, notificationsService, webhookService, configService);
  }

  async processSmsSnsNotificationQueue(id: number): Promise<void> {
    return super.processNotificationQueue(id, async () => {
      const notification = (await this.notificationsService.getNotificationById(id))[0];
      return this.smsSnsService.sendMessage(
        notification.data as unknown as SmsSnsData,
        notification.providerId,
      );
    });
  }
}
