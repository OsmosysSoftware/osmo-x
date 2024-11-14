import { Injectable, Logger } from '@nestjs/common';
import { ArchivedNotification } from './entities/archived-notification.entity';
import { DataSource, In, QueryRunner } from 'typeorm';
import { Notification } from 'src/modules/notifications/entities/notification.entity';
import { ConfigService } from '@nestjs/config';
import { DeliveryStatus } from 'src/common/constants/notifications';
import { Status } from 'src/common/constants/database';

@Injectable()
export class ArchivedNotificationsService {
  protected readonly logger = new Logger(ArchivedNotificationsService.name);

  constructor(
    private readonly configService: ConfigService,
    private dataSource: DataSource,
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
        `Preparing ArchivedNotification entry using NotificationID: ${archivedNotification.notificationId}, DeliveryStatus: ${archivedNotification.deliveryStatus}, ApplicationID: ${archivedNotification.applicationId}, ProviderID: ${archivedNotification.providerId}`,
      );

      return archivedNotification;
    });
  }

  async moveCompletedNotificationsToArchiveTable(): Promise<void> {
    const archiveLimit = this.configService.get<number>('ARCHIVE_LIMIT', 1000);

    try {
      this.logger.log('Creating queryRunner and starting transaction');
      const queryRunner: QueryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        // Step 1: Retrieve the notifications to archive
        this.logger.log(`Retrieve the top ${archiveLimit} notifications to archive`);
        const notificationsToArchive = await queryRunner.manager.find(Notification, {
          where: {
            deliveryStatus: In([DeliveryStatus.SUCCESS, DeliveryStatus.FAILED]),
            status: Status.ACTIVE,
          },
          order: {
            createdOn: 'ASC',
          },
          take: archiveLimit,
        });

        if (notificationsToArchive.length === 0) {
          this.logger.log('No notifications to archive at this time.');
          await queryRunner.commitTransaction();
          return;
        }

        // Step 2: Convert notifications to archived notifications
        const archivedNotificationsArray =
          this.convertToArchivedNotifications(notificationsToArchive);

        // Step 3: Insert notifications into the archive table
        this.logger.log(`Inserting archived notifications into the archive table`);
        await queryRunner.manager.save(ArchivedNotification, archivedNotificationsArray);

        // Step 4: Delete notifications from the main table
        this.logger.log(`Deleting notifications from the main table`);
        const idsToDelete = notificationsToArchive.map((notification) => notification.id);
        this.logger.log(`Notification IDs to delete: ${idsToDelete}`);
        await queryRunner.manager.delete(Notification, idsToDelete);

        await queryRunner.commitTransaction();
        this.logger.log('Transaction successful');
      } catch (error) {
        this.logger.error('Error while archiving notifications. Rolling back transaction');
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        await queryRunner.release();
      }
    } catch (error) {
      this.logger.error(`Failed to archive notifications: ${error.message}`);
      throw error;
    }
  }

  async archiveCompletedNotificationsCron(): Promise<void> {
    try {
      this.logger.log('Running archive notifications cron task');
      await this.moveCompletedNotificationsToArchiveTable();
      this.logger.log(`Archive notifications cron task completed`);
    } catch (error) {
      this.logger.error('Cron job failed:', error);
      throw error;
    }
  }
}
