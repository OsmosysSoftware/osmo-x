import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, In } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { ArchivedNotificationsService } from './archived-notifications.service';
import { ArchivedNotification } from './entities/archived-notification.entity';
import { RetryNotification } from '../notifications/entities/retry-notification.entity';
import { WebhookLog } from '../webhook/entities/webhook-log.entity';
import { ApplicationsService } from '../applications/applications.service';
import { NotificationDataFilterHelper } from '../notifications/helpers/notification-data-filter.helper';

describe('ArchivedNotificationsService', () => {
  let service: ArchivedNotificationsService;
  let archivedNotificationRepository: Record<string, jest.Mock>;
  let configService: { get: jest.Mock };
  let queryRunner: {
    connect: jest.Mock;
    startTransaction: jest.Mock;
    commitTransaction: jest.Mock;
    rollbackTransaction: jest.Mock;
    release: jest.Mock;
    manager: {
      find: jest.Mock;
      delete: jest.Mock;
      createQueryBuilder: jest.Mock;
    };
  };
  let dataSource: { createQueryRunner: jest.Mock };

  const archivedEntry = {
    id: 1,
    notificationId: 42,
    createdOn: new Date('2020-01-01'),
  };

  beforeEach(async () => {
    archivedNotificationRepository = { find: jest.fn(), findOne: jest.fn() };
    configService = {
      get: jest.fn((key: string, def?: string) => {
        if (key === 'DELETE_ARCHIVED_NOTIFICATIONS_OLDER_THAN') return def ?? '90d';
        if (key === 'ENABLE_ARCHIVED_NOTIFICATION_DELETION') return 'true';
        return def;
      }),
    };

    const orphanQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([]),
    };

    queryRunner = {
      connect: jest.fn().mockResolvedValue(undefined),
      startTransaction: jest.fn().mockResolvedValue(undefined),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
      manager: {
        find: jest.fn().mockResolvedValueOnce([archivedEntry]).mockResolvedValue([]),
        delete: jest.fn().mockResolvedValue({ affected: 1 }),
        createQueryBuilder: jest.fn().mockReturnValue(orphanQueryBuilder),
      },
    };
    dataSource = { createQueryRunner: jest.fn().mockReturnValue(queryRunner) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArchivedNotificationsService,
        {
          provide: getRepositoryToken(ArchivedNotification),
          useValue: archivedNotificationRepository,
        },
        { provide: ConfigService, useValue: configService },
        { provide: DataSource, useValue: dataSource },
        { provide: ApplicationsService, useValue: {} },
        { provide: NotificationDataFilterHelper, useValue: {} },
      ],
    }).compile();

    service = module.get<ArchivedNotificationsService>(ArchivedNotificationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('deleteOldArchivedNotifications', () => {
    it('deletes webhook logs for the same notification IDs as the purged archived batch, in the same transaction', async () => {
      await service.deleteOldArchivedNotifications();

      expect(queryRunner.manager.delete).toHaveBeenCalledWith(WebhookLog, {
        notificationId: In([42]),
      });
      expect(queryRunner.manager.delete).toHaveBeenCalledWith(RetryNotification, {
        notification_id: In([42]),
      });
      expect(queryRunner.manager.delete).toHaveBeenCalledWith(ArchivedNotification, [1]);
      // Phase 1 (the actual purge) commits successfully. Phase 2's own rollback for finding
      // zero orphaned retries is a separate, expected no-op — not a Phase 1 failure signal.
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });

    it('rolls back the whole batch, including the webhook-log delete, if anything in Phase 1 throws', async () => {
      queryRunner.manager.delete.mockImplementation((entity: unknown) => {
        if (entity === ArchivedNotification) {
          throw new Error('db error deleting archived notification');
        }

        return Promise.resolve({ affected: 1 });
      });

      await expect(service.deleteOldArchivedNotifications()).rejects.toThrow(
        'db error deleting archived notification',
      );

      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.commitTransaction).not.toHaveBeenCalled();
    });

    it('does nothing when there are no archived notifications past the cutoff', async () => {
      queryRunner.manager.find.mockReset().mockResolvedValue([]);

      await service.deleteOldArchivedNotifications();

      expect(queryRunner.manager.delete).not.toHaveBeenCalledWith(WebhookLog, expect.anything());
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
    });
  });
});
