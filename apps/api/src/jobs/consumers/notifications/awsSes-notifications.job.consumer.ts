import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationsService } from 'src/modules/notifications/notifications.service';
import { Notification } from 'src/modules/notifications/entities/notification.entity';
import { NotificationConsumer } from './notification.consumer';
import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { WebhookService } from 'src/modules/webhook/webhook.service';
import { AwsSesData, AwsSesService } from 'src/modules/providers/aws-ses/aws-ses.service';
import { NotificationQueueProducer } from 'src/jobs/producers/notifications/notifications.job.producer';

@Injectable()
export class AwsSesNotificationConsumer extends NotificationConsumer {
  constructor(
    @InjectRepository(Notification)
    protected readonly notificationRepository: Repository<Notification>,
    private readonly awsSesService: AwsSesService,
    @Inject(forwardRef(() => NotificationsService))
    notificationsService: NotificationsService,
    @Inject(forwardRef(() => NotificationQueueProducer))
    notificationsQueueService: NotificationQueueProducer,
    configService: ConfigService,
    webhookService: WebhookService,
  ) {
    super(
      notificationRepository,
      notificationsService,
      notificationsQueueService,
      webhookService,
      configService,
    );
  }

  async processAwsSesNotificationQueue(id: number): Promise<void> {
    return super.processNotificationQueue(id, async () => {
      const notification = (await this.notificationsService.getNotificationById(id))[0];
      return this.awsSesService.sendAwsSes(
        notification.data as unknown as AwsSesData,
        notification.providerId,
      );
    });
  }
}
