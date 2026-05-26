import { DataSource, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { ArchivedNotificationsService } from './archived-notifications.service';
import { ArchivedNotification } from './entities/archived-notification.entity';
import { ApplicationsService } from '../applications/applications.service';
import { NotificationDataFilterHelper } from '../notifications/helpers/notification-data-filter.helper';
import { Notification } from 'src/modules/notifications/entities/notification.entity';
import { RetryNotification } from 'src/modules/notifications/entities/retry-notification.entity';

interface QueryRunnerStub {
  connect: jest.Mock;
  startTransaction: jest.Mock;
  commitTransaction: jest.Mock;
  rollbackTransaction: jest.Mock;
  release: jest.Mock;
  manager: {
    find: jest.Mock;
    save: jest.Mock;
    delete: jest.Mock;
  };
}

interface Bundle {
  service: ArchivedNotificationsService;
  queryRunner: QueryRunnerStub;
  configMap: Record<string, unknown>;
}

function buildService(configMap: Record<string, unknown> = {}): Bundle {
  const repository = {} as Repository<ArchivedNotification>;

  const queryRunner: QueryRunnerStub = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      find: jest.fn(),
      save: jest.fn(),
      delete: jest.fn().mockResolvedValue({ affected: 0 }),
    },
  };

  const dataSource = {
    createQueryRunner: jest.fn().mockReturnValue(queryRunner),
  } as unknown as DataSource;

  const configService = {
    get: jest.fn((key: string, fallback: unknown) =>
      configMap[key] !== undefined ? configMap[key] : fallback,
    ),
  } as unknown as ConfigService;

  const applicationsService = {} as ApplicationsService;
  const dataFilterHelper = {} as NotificationDataFilterHelper;

  const service = new ArchivedNotificationsService(
    repository,
    configService,
    dataSource,
    applicationsService,
    dataFilterHelper,
  );

  return { service, queryRunner, configMap };
}

describe('ArchivedNotificationsService', () => {
  describe('moveCompletedNotificationsToArchiveTable', () => {
    it('commits empty transaction when no SUCCESS/FAILED notifications exist', async () => {
      const { service, queryRunner } = buildService();
      queryRunner.manager.find.mockResolvedValue([]);

      await service.moveCompletedNotificationsToArchiveTable();

      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(queryRunner.manager.save).not.toHaveBeenCalled();
      expect(queryRunner.manager.delete).not.toHaveBeenCalled();
    });

    it('inserts archived rows then deletes originals by id list inside a transaction', async () => {
      const { service, queryRunner } = buildService();
      const notifications = [
        { id: 1, applicationId: 100, providerId: 10, deliveryStatus: 5, status: 1 },
        { id: 2, applicationId: 100, providerId: 11, deliveryStatus: 6, status: 1 },
      ];
      queryRunner.manager.find.mockResolvedValue(notifications);
      queryRunner.manager.save.mockResolvedValue(undefined);

      await service.moveCompletedNotificationsToArchiveTable();

      expect(queryRunner.manager.save).toHaveBeenCalledWith(
        ArchivedNotification,
        expect.arrayContaining([
          expect.objectContaining({ notificationId: 1 }),
          expect.objectContaining({ notificationId: 2 }),
        ]),
      );
      expect(queryRunner.manager.delete).toHaveBeenCalledWith(Notification, [1, 2]);
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('rolls back and rethrows when save fails', async () => {
      const { service, queryRunner } = buildService();
      queryRunner.manager.find.mockResolvedValue([
        { id: 1, applicationId: 100, providerId: 10, deliveryStatus: 5, status: 1 },
      ]);
      queryRunner.manager.save.mockRejectedValue(new Error('insert failed'));

      await expect(service.moveCompletedNotificationsToArchiveTable()).rejects.toThrow(
        'insert failed',
      );
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.commitTransaction).not.toHaveBeenCalled();
    });

    it('always releases the queryRunner', async () => {
      const { service, queryRunner } = buildService();
      queryRunner.manager.find.mockResolvedValue([]);

      await service.moveCompletedNotificationsToArchiveTable();

      expect(queryRunner.release).toHaveBeenCalled();
    });

    it('honors ARCHIVE_LIMIT from config for the take parameter', async () => {
      const { service, queryRunner } = buildService({ ARCHIVE_LIMIT: 250 });
      queryRunner.manager.find.mockResolvedValue([]);

      await service.moveCompletedNotificationsToArchiveTable();

      expect(queryRunner.manager.find).toHaveBeenCalledWith(
        Notification,
        expect.objectContaining({ take: 250 }),
      );
    });
  });

  describe('deleteOldArchivedNotifications', () => {
    it('throws when retention period is non-positive', async () => {
      const { service } = buildService({ DELETE_ARCHIVED_NOTIFICATIONS_OLDER_THAN: '0d' });

      await expect(service.deleteOldArchivedNotifications()).rejects.toThrow(
        'Invalid retention period',
      );
    });

    it('throws when retention period exceeds 10 years', async () => {
      const { service } = buildService({ DELETE_ARCHIVED_NOTIFICATIONS_OLDER_THAN: '11y' });

      await expect(service.deleteOldArchivedNotifications()).rejects.toThrow(
        'Invalid retention period',
      );
    });

    it('throws when retention period is unparseable', async () => {
      const { service } = buildService({ DELETE_ARCHIVED_NOTIFICATIONS_OLDER_THAN: 'not-a-time' });

      await expect(service.deleteOldArchivedNotifications()).rejects.toThrow(
        'Invalid retention period',
      );
    });

    it('exits the loop immediately when the first batch is empty', async () => {
      const { service, queryRunner } = buildService();
      queryRunner.manager.find.mockResolvedValue([]);

      await service.deleteOldArchivedNotifications();

      expect(queryRunner.manager.find).toHaveBeenCalledTimes(1);
      expect(queryRunner.manager.delete).not.toHaveBeenCalled();
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('deletes retry rows BEFORE archived rows (FK ordering) for each batch', async () => {
      const { service, queryRunner } = buildService();
      const batch = [
        { id: 1, notificationId: 100, createdOn: new Date('2020-01-01') },
        { id: 2, notificationId: 101, createdOn: new Date('2020-01-02') },
      ];
      queryRunner.manager.find.mockResolvedValueOnce(batch).mockResolvedValueOnce([]);
      queryRunner.manager.delete.mockResolvedValue({ affected: batch.length });

      await service.deleteOldArchivedNotifications();

      const deleteCalls = queryRunner.manager.delete.mock.calls;
      // First call must target retries
      expect(deleteCalls[0][0]).toBe(RetryNotification);
      expect(deleteCalls[0][1]).toEqual({ notification_id: expect.anything() });
      // Second call must target archived rows by id
      expect(deleteCalls[1][0]).toBe(ArchivedNotification);
      expect(deleteCalls[1][1]).toEqual([1, 2]);
    });

    it('rolls back the transaction on error', async () => {
      const { service, queryRunner } = buildService();
      queryRunner.manager.find.mockResolvedValueOnce([
        { id: 1, notificationId: 100, createdOn: new Date('2020-01-01') },
      ]);
      queryRunner.manager.delete.mockRejectedValueOnce(new Error('delete failed'));

      await expect(service.deleteOldArchivedNotifications()).rejects.toThrow('delete failed');
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    });
  });
});
