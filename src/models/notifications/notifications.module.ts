import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { Notification } from './entities/notification.entity';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationQueueProducer } from 'src/jobs/producers/notifications/notifications.job.producer';
import { SmtpNotificationConsumer } from 'src/jobs/consumers/notifications/smtp-notifications.job.consumer';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification]),
    BullModule.registerQueue({
      name: 'smtpNotifications',
    }),
  ],
  providers: [NotificationQueueProducer, SmtpNotificationConsumer, NotificationsService],
  exports: [NotificationsService],
  controllers: [NotificationsController],
})
export class NotificationsModule {}
