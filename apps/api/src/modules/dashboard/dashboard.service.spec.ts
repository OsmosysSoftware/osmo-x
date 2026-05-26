import { Repository } from 'typeorm';
import { DashboardService } from './dashboard.service';
import { Notification } from '../notifications/entities/notification.entity';
import { ArchivedNotification } from '../archived-notifications/entities/archived-notification.entity';
import { Application } from '../applications/entities/application.entity';
import { Provider } from '../providers/entities/provider.entity';
import { DeliveryStatus } from 'src/common/constants/notifications';

type Mocked<T> = { [K in keyof T]: jest.Mock };

interface Bundle {
  service: DashboardService;
  applicationRepository: Mocked<Repository<Application>>;
  notificationRepository: Mocked<Repository<Notification>>;
  providerRepository: { createQueryBuilder: jest.Mock };
  providerQb: { where: jest.Mock; andWhere: jest.Mock; getCount: jest.Mock };
}

function buildService(): Bundle {
  const applicationRepository = {
    find: jest.fn(),
  } as unknown as Mocked<Repository<Application>>;

  const notificationRepository = {
    query: jest.fn(),
  } as unknown as Mocked<Repository<Notification>>;

  const archivedNotificationRepository = {} as Repository<ArchivedNotification>;

  const providerQb = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getCount: jest.fn().mockResolvedValue(0),
  };
  const providerRepository = {
    createQueryBuilder: jest.fn().mockReturnValue(providerQb),
  };

  const service = new DashboardService(
    notificationRepository as unknown as Repository<Notification>,
    archivedNotificationRepository,
    applicationRepository as unknown as Repository<Application>,
    providerRepository as unknown as Repository<Provider>,
  );

  return { service, applicationRepository, notificationRepository, providerRepository, providerQb };
}

describe('DashboardService', () => {
  describe('getStats', () => {
    it('returns all-zero stats when the organization has no applications', async () => {
      const { service, applicationRepository, providerRepository } = buildService();
      applicationRepository.find.mockResolvedValue([]);

      const stats = await service.getStats(1);

      expect(stats).toEqual({
        totalApplications: 0,
        totalProviders: 0,
        totalNotifications: 0,
        successfulNotifications: 0,
        failedNotifications: 0,
        pendingNotifications: 0,
        successRate: 0,
      });
      // Skip downstream queries entirely on fast-path
      expect(providerRepository.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('aggregates totals and computes a percentage success rate with 2-decimal rounding', async () => {
      const { service, applicationRepository, notificationRepository, providerQb } = buildService();
      applicationRepository.find.mockResolvedValue([
        { applicationId: 100 },
        { applicationId: 101 },
      ]);
      providerQb.getCount.mockResolvedValue(5);
      notificationRepository.query.mockResolvedValue([
        { delivery_status: String(DeliveryStatus.SUCCESS), cnt: '8' },
        { delivery_status: String(DeliveryStatus.FAILED), cnt: '2' },
      ]);

      const stats = await service.getStats(1);

      expect(stats.totalApplications).toBe(2);
      expect(stats.totalProviders).toBe(5);
      expect(stats.totalNotifications).toBe(10);
      expect(stats.successfulNotifications).toBe(8);
      expect(stats.failedNotifications).toBe(2);
      expect(stats.pendingNotifications).toBe(0);
      // 8/10 = 80% expressed as 80
      expect(stats.successRate).toBe(80);
    });

    it('returns zero successRate when totalNotifications is zero', async () => {
      const { service, applicationRepository, notificationRepository } = buildService();
      applicationRepository.find.mockResolvedValue([{ applicationId: 100 }]);
      notificationRepository.query.mockResolvedValue([]);

      const stats = await service.getStats(1);

      expect(stats.successRate).toBe(0);
      expect(stats.totalNotifications).toBe(0);
    });

    it('captures pending notifications count separately', async () => {
      const { service, applicationRepository, notificationRepository } = buildService();
      applicationRepository.find.mockResolvedValue([{ applicationId: 100 }]);
      notificationRepository.query.mockResolvedValue([
        { delivery_status: String(DeliveryStatus.PENDING), cnt: '3' },
      ]);

      const stats = await service.getStats(1);

      expect(stats.pendingNotifications).toBe(3);
      expect(stats.totalNotifications).toBe(3);
    });

    it('passes appIds as positional parameters to the raw SQL', async () => {
      const { service, applicationRepository, notificationRepository } = buildService();
      applicationRepository.find.mockResolvedValue([
        { applicationId: 100 },
        { applicationId: 101 },
      ]);
      notificationRepository.query.mockResolvedValue([]);

      await service.getStats(1);

      const [, params] = notificationRepository.query.mock.calls[0];
      expect(params).toEqual([100, 101]);
    });
  });

  describe('getAnalytics', () => {
    it('returns empty arrays as fast-path when no applications belong to the org', async () => {
      const { service, applicationRepository, notificationRepository } = buildService();
      applicationRepository.find.mockResolvedValue([]);

      const result = await service.getAnalytics(1);

      expect(result).toEqual({
        trends: [],
        channelBreakdown: [],
        applicationStats: [],
        providerStats: [],
      });
      expect(notificationRepository.query).not.toHaveBeenCalled();
    });

    it('runs all four analytics sub-queries in parallel and returns their shapes', async () => {
      const { service, applicationRepository, notificationRepository } = buildService();
      applicationRepository.find.mockResolvedValue([{ applicationId: 100, name: 'AppA' }]);
      notificationRepository.query.mockImplementation((sql: string) => {
        // Order matters: each branch must check for a string unique to that query.
        if (sql.includes('avg_retry_count')) {
          return Promise.resolve([
            {
              provider_id: '10',
              provider_name: 'P10',
              channel_type: '1',
              total: '4',
              successful: '3',
              failed: '1',
              avg_retry_count: '0.50',
            },
          ]);
        }

        if (sql.includes('GROUP BY combined.application_id')) {
          return Promise.resolve([
            { application_id: '100', total: '4', successful: '3', failed: '1' },
          ]);
        }

        if (sql.includes('GROUP BY combined.channel_type')) {
          return Promise.resolve([{ channel_type: '1', total: '4', successful: '3', failed: '1' }]);
        }

        // The trends query groups by a TO_CHAR(...) date expression
        if (sql.includes('TO_CHAR(')) {
          return Promise.resolve([
            { date: '2025-01-01', total: '4', successful: '3', failed: '1' },
          ]);
        }

        return Promise.resolve([]);
      });

      const result = await service.getAnalytics(1, '24h', undefined, 'both', 'UTC');

      expect(result.trends).toEqual([{ date: '2025-01-01', total: 4, successful: 3, failed: 1 }]);
      expect(result.channelBreakdown).toEqual([
        { channelType: 1, total: 4, successful: 3, failed: 1 },
      ]);
      expect(result.applicationStats).toEqual([
        expect.objectContaining({
          applicationId: 100,
          applicationName: 'AppA',
          total: 4,
          successful: 3,
          failed: 1,
          successRate: 75,
        }),
      ]);
      expect(result.providerStats).toEqual([
        expect.objectContaining({
          providerId: 10,
          providerName: 'P10',
          channelType: 1,
          avgRetryCount: 0.5,
        }),
      ]);
    });

    it('restricts to applicationId when it belongs to the org', async () => {
      const { service, applicationRepository, notificationRepository } = buildService();
      applicationRepository.find.mockResolvedValue([
        { applicationId: 100, name: 'A' },
        { applicationId: 101, name: 'B' },
      ]);
      notificationRepository.query.mockResolvedValue([]);

      await service.getAnalytics(1, '24h', 101);

      // Each of 4 sub-queries gets [101] as params
      const calls = notificationRepository.query.mock.calls;
      expect(calls.length).toBe(4);
      calls.forEach(([, params]) => {
        expect(params).toEqual([101]);
      });
    });

    it('ignores applicationId when it does not belong to the org', async () => {
      const { service, applicationRepository, notificationRepository } = buildService();
      applicationRepository.find.mockResolvedValue([{ applicationId: 100, name: 'A' }]);
      notificationRepository.query.mockResolvedValue([]);

      await service.getAnalytics(1, '24h', 999);

      const calls = notificationRepository.query.mock.calls;
      calls.forEach(([, params]) => {
        expect(params).toEqual([100]);
      });
    });
  });
});
