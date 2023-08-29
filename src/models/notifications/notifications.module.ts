import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { Notification } from './entities/notification.entity';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationQueueService } from 'src/jobs/producers/notifications/notifications.job.producer';
import { SmtpNotificationConsumerService } from 'src/jobs/consumers/notifications/smtp-notifications.job.consumer';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification]),
    BullModule.registerQueue({
      name: 'smtpNotifications',
    }),
  ],
  providers: [
    NotificationQueueService,
    SmtpNotificationConsumerService,
    NotificationsService,
  ],
  exports: [NotificationsService],
  controllers: [NotificationsController],
})
export class NotificationsModule {}
