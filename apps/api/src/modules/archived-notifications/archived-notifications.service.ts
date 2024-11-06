import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { ArchivedNotification } from './entities/archived-notification.entity';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Notification } from 'src/modules/notifications/entities/notification.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ArchivedNotificationsService {
  protected readonly logger = new Logger(ArchivedNotificationsService.name);

  constructor(
    @InjectRepository(ArchivedNotification)
    private readonly archivedNotificationRepository: Repository<ArchivedNotification>,
    @Inject(forwardRef(() => NotificationsService))
    protected readonly notificationsService: NotificationsService,
    private readonly configService: ConfigService,
  ) {}

  private convertToArchivedNotifications(notifications: Notification[]): ArchivedNotification[] {
    return notifications.map((notification) => {
      const archivedNotification = new ArchivedNotification();
      archivedNotification.applicationId = notification.applicationId;
      archivedNotification.channelType = notification.channelType;
      archivedNotification.createdBy = notification.createdBy;
      archivedNotification.createdOn = notification.createdOn;
      archivedNotification.data = notification.data;
      archivedNotification.deliveryStatus = notification.deliveryStatus;
      archivedNotification.notificationId = notification.id;
      archivedNotification.providerId = notification.providerId;
      archivedNotification.result = notification.result;
      archivedNotification.retryCount = notification.retryCount;
      archivedNotification.updatedBy = notification.updatedBy;
      archivedNotification.updatedOn = notification.updatedOn;
      archivedNotification.status = notification.status;

      this.logger.debug(
        `Created ArchivedNotification array using Notification ID: ${notification.id}, deliveryStatus: ${notification.deliveryStatus}`,
      );
      return archivedNotification;
    });
  }

  async moveNotificationsToArchive(): Promise<void> {
    const archiveLimit = this.configService.get<number>('ARCHIVE_LIMIT', 1000);

    try {
      // Step 1: Retrieve the notifications to archive
      this.logger.log(`Retrieve the top ${archiveLimit} notifications to archive`);
      const notificationsToArchive =
        await this.notificationsService.findNotificationsToArchive(archiveLimit);

      if (notificationsToArchive.length === 0) {
        this.logger.log('No notifications to archive at this time.');
        return;
      }

      // Step 2: Convert notifications to archived notifications
      const archivedNotificationsArray =
        this.convertToArchivedNotifications(notificationsToArchive);

      // Step 3: Insert notifications into the archive table
      this.logger.log(`Inserting archived notifications into the archive table`);
      await this.archivedNotificationRepository.save(archivedNotificationsArray, {
        transaction: true,
      });

      // Step 4: Delete notifications from the main table by IDs
      this.logger.log(`Deleting notifications from the main table by IDs`);
      await this.notificationsService.deleteArchivedNotifications(notificationsToArchive);

      this.logger.log(`Archive notifications task completed`);
    } catch (error) {
      this.logger.error('Failed to archive notifications:', error);
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async ArchiveCompletedNotificationsCron(): Promise<void> {
    this.logger.log('Running archive notifications task');
    await this.moveNotificationsToArchive();
  }
}
