import { Injectable, Logger } from '@nestjs/common';
import { ArchivedNotification } from './entities/archived-notification.entity';
import { DataSource, In, LessThan, QueryRunner, Repository } from 'typeorm';
import { Notification } from 'src/modules/notifications/entities/notification.entity';
import { ConfigService } from '@nestjs/config';
import { DeliveryStatus } from 'src/common/constants/notifications';
import { Status } from 'src/common/constants/database';
import { QueryOptionsDto } from 'src/common/graphql/dtos/query-options.dto';
import { ArchivedNotificationResponse } from './dtos/archived-notification-response.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { CoreService } from 'src/common/graphql/services/core.service';
import ms = require('ms');
import * as path from 'path';
import * as fs from 'fs/promises';
import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { format } from '@fast-csv/format';

@Injectable()
export class ArchivedNotificationsService extends CoreService<ArchivedNotification> {
  protected readonly logger = new Logger(ArchivedNotificationsService.name);

  constructor(
    @InjectRepository(ArchivedNotification)
    private readonly archivedNotificationRepository: Repository<ArchivedNotification>,
    private readonly configService: ConfigService,
    private dataSource: DataSource,
  ) {
    super(archivedNotificationRepository);
  }

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
      archivedNotification.notificationSentOn = notification.notificationSentOn;
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
      this.logger.error(`Cron job failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getAllArchivedNotifications(
    options: QueryOptionsDto,
  ): Promise<ArchivedNotificationResponse> {
    this.logger.log('Getting all archived notifications with options.');

    const baseConditions = [{ field: 'status', value: Status.ACTIVE }];
    const searchableFields = ['createdBy', 'data', 'result'];

    const { items, total } = await super.findAll(
      options,
      'archivedNotification',
      searchableFields,
      baseConditions,
    );
    return new ArchivedNotificationResponse(items, total, options.offset, options.limit);
  }

  async getArchivedNotificationFromNotificationId(
    notificationId: number,
  ): Promise<ArchivedNotification | null> {
    this.logger.log(`Getting notification with id: ${notificationId} from archive table.`);
    const archivedNotification = await this.archivedNotificationRepository.findOne({
      where: {
        notificationId: notificationId,
        status: Status.ACTIVE,
      },
    });
    return archivedNotification;
  }

  async deleteArchivedNotificationsCron(): Promise<void> {
    try {
      const enableArchivedNotificationDeletion = this.configService.get<string>(
        'ENABLE_ARCHIVED_NOTIFICATION_DELETION',
        'false',
      );

      if (enableArchivedNotificationDeletion.toLowerCase() === 'true') {
        this.logger.log('Running archived notification deletion cron task');
        await this.deleteArchivedEntriesAndGenerateCsvBackup();
        this.logger.log(`Archive notification deletion cron task completed`);
      } else {
        this.logger.log('Archived Notification Deletion Cron is disabled');
      }
    } catch (error) {
      this.logger.error(`Cron job failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async deleteArchivedEntriesAndGenerateCsvBackup(): Promise<void> {
    try {
      const deleteArchivedNotificationsOlderThan = this.configService.get<string>(
        'DELETE_ARCHIVED_NOTIFICATIONS_OLDER_THAN',
        '90d',
      );

      const maxRetentionMs = ms('10y');
      const retentionDurationMs = ms(deleteArchivedNotificationsOlderThan);

      // Guard rails
      if (
        typeof retentionDurationMs !== 'number' ||
        retentionDurationMs <= 0 ||
        retentionDurationMs > maxRetentionMs
      ) {
        throw new Error(
          'Invalid retention period. It must be a positive duration not exceeding 10 years.',
        );
      }

      const cutoffTimestamp = new Date(Date.now() - retentionDurationMs);
      const batchSize = 500;
      let flagBackupFileCreated = false;
      let archivedEntriesBatch: ArchivedNotification[] = [];

      // Update with json like nested fields as per archived-notification.entity file
      const nestedFields = ['data', 'result'];

      // Create directory, filename and path for backups
      const backupsDir = 'backups';
      const backupFileName = `archived_notifications_backup_${this.getFormattedTimestamp()}.csv`;
      const backupFilePath = path.join(backupsDir, backupFileName);

      // Ensure the backups directory exists
      try {
        if (!existsSync(backupsDir)) {
          mkdirSync(backupsDir, { recursive: true });
        }
      } catch (error) {
        throw new Error(`Failed to create backup directory at "${backupsDir}": ${error.message}`);
      }

      // Fast-CSV stream
      const csvStream = format({ headers: true });
      csvStream.pipe(createWriteStream(backupFilePath));

      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        do {
          // Fetch entries to delete
          archivedEntriesBatch = await queryRunner.manager.find(ArchivedNotification, {
            where: {
              createdOn: LessThan(cutoffTimestamp),
              status: Status.ACTIVE,
            },
            order: {
              createdOn: 'ASC',
            },
            take: batchSize,
          });

          if (archivedEntriesBatch.length === 0) {
            this.logger.log(
              `No more archived entries older than ${cutoffTimestamp} left to delete`,
            );
            break;
          }

          // Perform deletion
          const idsToDelete = archivedEntriesBatch.map((entry) => entry.id);
          await queryRunner.manager.delete(ArchivedNotification, idsToDelete);

          // Export to CSV
          for (const row of archivedEntriesBatch) {
            // Ensure data of nested fields is stringified before being added to csv
            const safeRow = Object.fromEntries(
              Object.entries(row).map(([key, value]) => [
                key,
                nestedFields.includes(key) && value !== null && typeof value === 'object'
                  ? JSON.stringify(value)
                  : value,
              ]),
            );

            csvStream.write(safeRow);
          }

          flagBackupFileCreated = true;
        } while (archivedEntriesBatch.length === batchSize);

        await queryRunner.commitTransaction();
        this.logger.log('Transaction Successful.');

        if (flagBackupFileCreated) {
          this.logger.log(
            `Deleted archived entries older than ${cutoffTimestamp}. Backup file created at ${backupFilePath}`,
          );
        } else {
          this.logger.log(`No entries found older than ${cutoffTimestamp}.`);

          if (backupFilePath) {
            try {
              await fs.unlink(backupFilePath);
              this.logger.log('Unnecessary CSV file has been deleted');
            } catch (unlinkError) {
              this.logger.error(
                `Failed to delete unnecessary CSV file ${backupFileName}: ${unlinkError.message}`,
              );
            }
          }
        }
      } catch (error) {
        await queryRunner.rollbackTransaction();
        this.logger.error('Error during deletion. Rolled back.', error.stack);

        // Delete CSV file if it was created
        if (backupFilePath) {
          try {
            await fs.unlink(backupFilePath);
            this.logger.log('CSV backup deleted due to rollback.');
          } catch (unlinkError) {
            this.logger.error(
              `Failed to delete backup file after rollback: ${unlinkError.message}`,
            );
          }
        }

        throw error;
      } finally {
        await queryRunner.release();
      }
    } catch (error) {
      this.logger.error(`Failed to delete archived notifications: ${error.message}`, error.stack);
      throw error;
    }
  }

  private getFormattedTimestamp(): string {
    const now = new Date();
    const yyyy = now.getFullYear().toString();
    const MM = (now.getMonth() + 1).toString().padStart(2, '0');
    const dd = now.getDate().toString().padStart(2, '0');
    const hh = now.getHours().toString().padStart(2, '0');
    const mm = now.getMinutes().toString().padStart(2, '0');
    const ss = now.getSeconds().toString().padStart(2, '0');
    return `${yyyy}${MM}${dd}_${hh}${mm}${ss}`;
  }
}
