import { Repository } from 'typeorm';
import { NotificationsService } from './notifications.service';
import { Notification } from './entities/notification.entity';
import { RetryNotification } from './entities/retry-notification.entity';
import { NotificationQueueProducer } from 'src/jobs/producers/notifications/notifications.job.producer';
import { ApplicationsService } from '../applications/applications.service';
import { ProvidersService } from '../providers/providers.service';
import { ArchivedNotificationsService } from '../archived-notifications/archived-notifications.service';
import { ProviderChainsService } from '../provider-chains/provider-chains.service';
import { ProviderChainMembersService } from '../provider-chain-members/provider-chain-members.service';
import { NotificationDataFilterHelper } from './helpers/notification-data-filter.helper';
import { DeliveryStatus, QueueAction } from 'src/common/constants/notifications';
import { IsEnabledStatus, Status } from 'src/common/constants/database';
import { NotFoundException, ValidationException } from 'src/common/exceptions/app.exception';
import { Provider } from '../providers/entities/provider.entity';
import { ProviderChain } from '../provider-chains/entities/provider-chain.entity';
import { Application } from '../applications/entities/application.entity';

type Mocked<T> = { [K in keyof T]: jest.Mock };

function buildService(
  overrides: {
    notificationRepository?: Partial<Mocked<Repository<Notification>>>;
    retryNotificationRepository?: Partial<Mocked<Repository<RetryNotification>>>;
    notificationQueueService?: Partial<Mocked<NotificationQueueProducer>>;
    applicationsService?: Partial<Mocked<ApplicationsService>>;
    providersService?: Partial<Mocked<ProvidersService>>;
    archivedNotificationsService?: Partial<Mocked<ArchivedNotificationsService>>;
    providerChainsService?: Partial<Mocked<ProviderChainsService>>;
    providerChainMembersService?: Partial<Mocked<ProviderChainMembersService>>;
    dataFilterHelper?: Partial<Mocked<NotificationDataFilterHelper>>;
  } = {},
): {
  service: NotificationsService;
  notificationRepository: Mocked<Repository<Notification>>;
  notificationQueueService: Mocked<NotificationQueueProducer>;
  applicationsService: Mocked<ApplicationsService>;
  providersService: Mocked<ProvidersService>;
  providerChainsService: Mocked<ProviderChainsService>;
  providerChainMembersService: Mocked<ProviderChainMembersService>;
  retryNotificationRepository: Mocked<Repository<RetryNotification>>;
} {
  const notificationRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    ...overrides.notificationRepository,
  } as unknown as Mocked<Repository<Notification>>;

  const retryNotificationRepository = {
    save: jest.fn(),
    ...overrides.retryNotificationRepository,
  } as unknown as Mocked<Repository<RetryNotification>>;

  const notificationQueueService = {
    addNotificationToQueue: jest.fn(),
    ...overrides.notificationQueueService,
  } as unknown as Mocked<NotificationQueueProducer>;

  const applicationsService = {
    findById: jest.fn(),
    getApplicationIdsByOrganization: jest.fn(),
    ...overrides.applicationsService,
  } as unknown as Mocked<ApplicationsService>;

  const providersService = {
    getById: jest.fn(),
    ...overrides.providersService,
  } as unknown as Mocked<ProvidersService>;

  const archivedNotificationsService = {
    getArchivedNotificationFromNotificationId: jest.fn(),
    ...overrides.archivedNotificationsService,
  } as unknown as Mocked<ArchivedNotificationsService>;

  const providerChainsService = {
    getByProviderChainName: jest.fn(),
    ...overrides.providerChainsService,
  } as unknown as Mocked<ProviderChainsService>;

  const providerChainMembersService = {
    getFirstPriorityProviderChainMemberByChainId: jest.fn(),
    ...overrides.providerChainMembersService,
  } as unknown as Mocked<ProviderChainMembersService>;

  const dataFilterHelper = {
    applyTo: jest.fn(),
    ...overrides.dataFilterHelper,
  } as unknown as Mocked<NotificationDataFilterHelper>;

  const service = new NotificationsService(
    notificationRepository as unknown as Repository<Notification>,
    retryNotificationRepository as unknown as Repository<RetryNotification>,
    notificationQueueService as unknown as NotificationQueueProducer,
    applicationsService as unknown as ApplicationsService,
    providersService as unknown as ProvidersService,
    archivedNotificationsService as unknown as ArchivedNotificationsService,
    providerChainsService as unknown as ProviderChainsService,
    providerChainMembersService as unknown as ProviderChainMembersService,
    dataFilterHelper as unknown as NotificationDataFilterHelper,
  );

  return {
    service,
    notificationRepository,
    notificationQueueService,
    applicationsService,
    providersService,
    providerChainsService,
    providerChainMembersService,
    retryNotificationRepository,
  };
}

function buildPendingNotification(overrides: Partial<Notification> = {}): Notification {
  const n = new Notification({
    id: overrides.id ?? 1,
    providerId: overrides.providerId ?? 10,
    channelType: overrides.channelType ?? 1,
    data: overrides.data ?? { to: 'a@b.com', subject: 's', text: 't' },
    deliveryStatus: overrides.deliveryStatus ?? DeliveryStatus.PENDING,
    status: overrides.status ?? Status.ACTIVE,
    retryCount: overrides.retryCount ?? 0,
    applicationId: overrides.applicationId ?? 100,
  });

  Object.assign(n, overrides);
  return n;
}

describe('NotificationsService', () => {
  describe('addNotificationsToQueue', () => {
    it('queries pending+active notifications and moves each to IN_PROGRESS before enqueueing', async () => {
      const n1 = buildPendingNotification({ id: 1, providerId: 10 });
      const n2 = buildPendingNotification({ id: 2, providerId: 11 });
      const { service, notificationRepository, notificationQueueService } = buildService({
        notificationRepository: {
          find: jest.fn().mockResolvedValue([n1, n2]),
          save: jest.fn().mockImplementation(async (n) => n),
        },
      });

      await service.addNotificationsToQueue();

      expect(notificationRepository.find).toHaveBeenCalledWith({
        where: { deliveryStatus: DeliveryStatus.PENDING, status: Status.ACTIVE },
      });
      expect(n1.deliveryStatus).toBe(DeliveryStatus.IN_PROGRESS);
      expect(n2.deliveryStatus).toBe(DeliveryStatus.IN_PROGRESS);
      expect(notificationQueueService.addNotificationToQueue).toHaveBeenCalledWith(
        QueueAction.SEND,
        n1,
      );
      expect(notificationQueueService.addNotificationToQueue).toHaveBeenCalledWith(
        QueueAction.SEND,
        n2,
      );
    });

    it('saves each notification twice (once after status flip, once in finally)', async () => {
      const n1 = buildPendingNotification({ id: 1 });
      const saveSpy = jest.fn().mockImplementation(async (n) => n);
      const { service } = buildService({
        notificationRepository: {
          find: jest.fn().mockResolvedValue([n1]),
          save: saveSpy,
        },
      });

      await service.addNotificationsToQueue();

      expect(saveSpy).toHaveBeenCalledTimes(2);
    });

    it('on producer error: resets status to PENDING, records retry, but still saves in finally', async () => {
      const n1 = buildPendingNotification({ id: 1 });
      const enqueueErr = new Error('queue exploded');
      const { service, retryNotificationRepository } = buildService({
        notificationRepository: {
          find: jest.fn().mockResolvedValue([n1]),
          save: jest.fn().mockImplementation(async (n) => n),
        },
        notificationQueueService: {
          addNotificationToQueue: jest.fn().mockRejectedValue(enqueueErr),
        },
      });

      await service.addNotificationsToQueue();

      expect(n1.deliveryStatus).toBe(DeliveryStatus.PENDING);
      expect(n1.result).toEqual({
        result: { message: enqueueErr.message, stack: enqueueErr.stack },
      });
      expect(retryNotificationRepository.save).toHaveBeenCalledTimes(1);
    });

    it('short-circuits when isProcessingQueue is already true', async () => {
      const { service, notificationRepository } = buildService();
      // Force the private flag on
      (service as unknown as { isProcessingQueue: boolean }).isProcessingQueue = true;

      await service.addNotificationsToQueue();

      expect(notificationRepository.find).not.toHaveBeenCalled();
    });

    it('does nothing when pending list is empty', async () => {
      const { service, notificationQueueService } = buildService({
        notificationRepository: {
          find: jest.fn().mockResolvedValue([]),
          save: jest.fn(),
        },
      });

      await service.addNotificationsToQueue();

      expect(notificationQueueService.addNotificationToQueue).not.toHaveBeenCalled();
    });

    it('resets isProcessingQueue to false when getPendingNotifications throws', async () => {
      const { service } = buildService({
        notificationRepository: {
          find: jest.fn().mockRejectedValue(new Error('db down')),
          save: jest.fn(),
        },
      });

      await service.addNotificationsToQueue();

      expect((service as unknown as { isProcessingQueue: boolean }).isProcessingQueue).toBe(false);
    });
  });

  describe('createNotification', () => {
    function buildApp(overrides: Partial<Application> = {}): Application {
      const app = new Application({});
      Object.assign(app, {
        applicationId: 100,
        name: 'TestApp',
        testModeEnabled: IsEnabledStatus.FALSE,
        whitelistRecipients: null,
        ...overrides,
      });
      return app;
    }

    function buildProvider(overrides: Partial<Provider> = {}): Provider {
      return {
        providerId: 10,
        applicationId: 100,
        channelType: 1,
        ...overrides,
      } as Provider;
    }

    it('resolves providerId path: sets channelType from provider and persists', async () => {
      const provider = buildProvider({ providerId: 10, channelType: 1, applicationId: 100 });
      const app = buildApp({ applicationId: 100, name: 'AppA' });
      const { service, providersService, applicationsService, notificationRepository } =
        buildService({
          providersService: {
            getById: jest.fn().mockResolvedValue(provider),
          },
          applicationsService: {
            findById: jest.fn().mockResolvedValue(app),
          },
          notificationRepository: {
            save: jest.fn().mockImplementation(async (n) => n),
          },
        });

      const saved = await service.createNotification({
        providerId: 10,
        data: { to: 'x@y.com' },
      } as never);

      expect(providersService.getById).toHaveBeenCalledWith(10);
      expect(applicationsService.findById).toHaveBeenCalledWith(100);
      expect(saved.applicationId).toBe(100);
      expect(saved.channelType).toBe(1);
      expect(saved.createdBy).toBe('AppA');
      expect(saved.updatedBy).toBe('AppA');
      expect(notificationRepository.save).toHaveBeenCalled();
    });

    it('resolves providerChain path: sets providerChainId, providerId, channelType from first member', async () => {
      const chain = { chainId: 7, chainName: 'fallback', applicationId: 100 } as ProviderChain;
      const firstMember = { providerId: 22 };
      const memberProvider = buildProvider({
        providerId: 22,
        channelType: 5,
        applicationId: 100,
      });
      const app = buildApp({ applicationId: 100, name: 'AppA' });
      const { service } = buildService({
        providersService: {
          getById: jest.fn().mockResolvedValue(memberProvider),
        },
        providerChainsService: {
          getByProviderChainName: jest.fn().mockResolvedValue(chain),
        },
        providerChainMembersService: {
          getFirstPriorityProviderChainMemberByChainId: jest.fn().mockResolvedValue(firstMember),
        },
        applicationsService: {
          findById: jest.fn().mockResolvedValue(app),
        },
        notificationRepository: {
          save: jest.fn().mockImplementation(async (n) => n),
        },
      });

      const saved = await service.createNotification({
        providerChain: 'fallback',
        data: { to: 'x@y.com' },
      } as never);

      expect(saved.providerChainId).toBe(7);
      expect(saved.providerId).toBe(22);
      expect(saved.channelType).toBe(5);
    });

    it('throws ValidationException when both providerId and providerChain are passed', async () => {
      const { service } = buildService();

      await expect(
        service.createNotification({ providerId: 1, providerChain: 'foo' } as never),
      ).rejects.toBeInstanceOf(ValidationException);
    });

    it('throws ValidationException when neither providerId nor providerChain is passed', async () => {
      const { service } = buildService();

      await expect(service.createNotification({} as never)).rejects.toBeInstanceOf(
        ValidationException,
      );
    });

    it('throws NotFoundException when providerId does not resolve to a provider', async () => {
      const { service } = buildService({
        providersService: { getById: jest.fn().mockResolvedValue(null) },
      });

      await expect(
        service.createNotification({ providerId: 999, data: {} } as never),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('test mode + non-whitelisted recipient short-circuits to SUCCESS without queue work', async () => {
      const provider = buildProvider({
        providerId: 10,
        channelType: 1,
        applicationId: 100,
      });
      const app = buildApp({
        applicationId: 100,
        name: 'AppA',
        testModeEnabled: IsEnabledStatus.TRUE,
        whitelistRecipients: { '10': ['allowed@example.com'] } as unknown as string,
      });
      const { service } = buildService({
        providersService: { getById: jest.fn().mockResolvedValue(provider) },
        applicationsService: { findById: jest.fn().mockResolvedValue(app) },
        notificationRepository: {
          save: jest.fn().mockImplementation(async (n) => n),
        },
      });

      const saved = await service.createNotification({
        providerId: 10,
        data: { to: 'someone-else@example.com' },
      } as never);

      expect(saved.deliveryStatus).toBe(DeliveryStatus.SUCCESS);
      expect(saved.result).toBeDefined();
    });
  });
});
