import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ArchivedNotification } from './entities/archived-notification.entity';
import { DataSource, In, LessThan, QueryRunner, Repository } from 'typeorm';
import { Notification } from 'src/modules/notifications/entities/notification.entity';
import { RetryNotification } from 'src/modules/notifications/entities/retry-notification.entity';
import { ConfigService } from '@nestjs/config';
import { DeliveryStatus } from 'src/common/constants/notifications';
import { Status } from 'src/common/constants/database';
import { QueryOptionsDto } from 'src/common/graphql/dtos/query-options.dto';
import { ArchivedNotificationResponse } from './dtos/archived-notification-response.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { CoreService } from 'src/common/graphql/services/core.service';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { PaginationMeta, PaginationHelper } from 'src/common/utils/pagination.helper';
import ms = require('ms');
import { ArchivedNotificationResponseDto } from './dto/archived-notification-response.dto';
import { ApplicationsService } from '../applications/applications.service';

@Injectable()
export class ArchivedNotificationsService extends CoreService<ArchivedNotification> {
  protected readonly logger = new Logger(ArchivedNotificationsService.name);

  constructor(
    @InjectRepository(ArchivedNotification)
    private readonly archivedNotificationRepository: Repository<ArchivedNotification>,
    private readonly configService: ConfigService,
    private dataSource: DataSource,
    private readonly applicationsService: ApplicationsService,
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

  private mapToDto(n: ArchivedNotification): ArchivedNotificationResponseDto {
    return {
      id: n.id,
      notificationId: n.notificationId,
      providerId: n.providerId,
      channelType: n.channelType,
      data: n.data,
      deliveryStatus: n.deliveryStatus,
      result: n.result,
      createdBy: n.createdBy,
      updatedBy: n.updatedBy,
      status: n.status,
      applicationId: n.applicationId,
      retryCount: n.retryCount,
      notificationSentOn: n.notificationSentOn,
      providerChainId: n.providerChainId,
      createdOn: n.createdOn,
      updatedOn: n.updatedOn,
    };
  }

  async findById(archivedNotificationId: number): Promise<ArchivedNotification | null> {
    return this.archivedNotificationRepository.findOne({
      where: { id: archivedNotificationId, status: Status.ACTIVE },
    });
  }

  async findByIdAsDto(
    archivedNotificationId: number,
    organizationId: number,
  ): Promise<ArchivedNotificationResponseDto> {
    const notification = await this.findById(archivedNotificationId);

    if (!notification) {
      throw new BadRequestException('Archived notification not found');
    }

    const appIds = await this.applicationsService.getApplicationIdsByOrganization(organizationId);

    if (!appIds.includes(notification.applicationId)) {
      throw new BadRequestException('Archived notification not found');
    }

    return this.mapToDto(notification);
  }

  async getAllArchivedNotificationsAsDto(
    query: PaginationQueryDto,
    organizationId: number,
    filters?: {
      channelType?: number;
      deliveryStatus?: number;
      applicationId?: number;
      dateFrom?: string;
      dateTo?: string;
    },
  ): Promise<{ items: ArchivedNotificationResponseDto[]; meta: PaginationMeta }> {
    let appIds = await this.applicationsService.getApplicationIdsByOrganization(organizationId);

    // If filtering by applicationId, restrict to that app (within org scope)
    if (filters?.applicationId) {
      appIds = appIds.includes(filters.applicationId) ? [filters.applicationId] : [];
    }

    if (appIds.length === 0) {
      const { page, limit } = PaginationHelper.normalizePaginationParams(query);

      return {
        items: [],
        meta: PaginationHelper.buildPaginationMeta(page, limit, 0),
      };
    }

    const baseConditions: Array<{ field: string; value: unknown; operator?: string }> = [
      { field: 'status', value: Status.ACTIVE },
      { field: 'applicationId', value: appIds, operator: 'in' },
    ];

    if (filters?.channelType) {
      baseConditions.push({ field: 'channelType', value: filters.channelType });
    }

    if (filters?.deliveryStatus) {
      baseConditions.push({ field: 'deliveryStatus', value: filters.deliveryStatus });
    }

    if (filters?.dateFrom) {
      baseConditions.push({
        field: 'createdOn',
        value: new Date(filters.dateFrom),
        operator: 'gte',
      });
    }

    if (filters?.dateTo) {
      baseConditions.push({
        field: 'createdOn',
        value: new Date(filters.dateTo),
        operator: 'lte',
      });
    }

    const searchableFields = ['createdBy', 'data', 'result'];

    const { items, meta } = await super.findAllPaginated(
      query,
      'archivedNotification',
      searchableFields,
      baseConditions,
    );

    return {
      items: items.map((n) => this.mapToDto(n)),
      meta,
    };
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
        await this.deleteOldArchivedNotifications();
        this.logger.log(`Archive notification deletion cron task completed`);
      } else {
        this.logger.log('Archived Notification Deletion Cron is disabled');
      }
    } catch (error) {
      this.logger.error(`Cron job failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async deleteOldArchivedNotifications(): Promise<void> {
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
      const batchSize = 1000;
      let totalDeletedArchived = 0;
      let totalDeletedRetries = 0;

      this.logger.log(
        `Starting deletion of archived notifications and retries older than ${cutoffTimestamp.toISOString()}`,
      );

      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        let archivedEntriesBatch: ArchivedNotification[] = [];

        do {
          // Fetch archived entries to delete
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

          this.logger.debug(
            `Query found ${archivedEntriesBatch.length} records. First record: ${archivedEntriesBatch.length > 0 ? JSON.stringify({ id: archivedEntriesBatch[0].id, notificationId: archivedEntriesBatch[0].notificationId, createdOn: archivedEntriesBatch[0].createdOn }) : 'None'}`,
          );

          if (archivedEntriesBatch.length === 0) {
            this.logger.debug(
              `No more archived entries older than ${cutoffTimestamp} left to delete`,
            );
            break;
          }

          // Get notification IDs for deleting related retry records
          const notificationIds = archivedEntriesBatch.map((entry) => entry.notificationId);

          // Delete retry entries first (foreign key constraint)
          const retryDeleteResult = await queryRunner.manager.delete(RetryNotification, {
            notification_id: In(notificationIds),
          });

          const retryAffected =
            typeof retryDeleteResult.affected === 'number' ? retryDeleteResult.affected : 0;
          totalDeletedRetries += retryAffected;

          // Delete archived notifications
          const archivedIds = archivedEntriesBatch.map((entry) => entry.id);
          await queryRunner.manager.delete(ArchivedNotification, archivedIds);
          totalDeletedArchived += archivedEntriesBatch.length;

          this.logger.debug(
            `Batch processed: ${archivedEntriesBatch.length} archived notifications, ${retryAffected} retry records deleted`,
          );
        } while (archivedEntriesBatch.length === batchSize);

        await queryRunner.commitTransaction();

        this.logger.log(
          `Successfully deleted ${totalDeletedArchived} archived notifications and ${totalDeletedRetries} retry records older than ${cutoffTimestamp.toISOString()}`,
        );
      } catch (error) {
        await queryRunner.rollbackTransaction();
        this.logger.error('Error during deletion. Transaction rolled back.', error.stack);
        throw error;
      } finally {
        await queryRunner.release();
      }
    } catch (error) {
      this.logger.error(`Failed to delete archived notifications: ${error.message}`, error.stack);
      throw error;
    }
  }
}
