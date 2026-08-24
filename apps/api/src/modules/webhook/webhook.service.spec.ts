import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { WebhookService } from './webhook.service';
import { Webhook } from './entities/webhook.entity';
import { WebhookLog } from './entities/webhook-log.entity';
import { WebhookDeliveryStatus } from './constants/webhook-delivery-status';
import { NotificationsService } from '../notifications/notifications.service';
import { ProvidersService } from '../providers/providers.service';
import { ApplicationsService } from '../applications/applications.service';
import { NotificationQueueProducer } from 'src/jobs/producers/notifications/notifications.job.producer';
import { Status } from 'src/common/constants/database';

jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('WebhookService', () => {
  let service: WebhookService;
  let webhookRepository: {
    findOneBy: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let webhookLogRepository: { save: jest.Mock; createQueryBuilder: jest.Mock };
  let queryBuilder: {
    update: jest.Mock;
    set: jest.Mock;
    where: jest.Mock;
    execute: jest.Mock;
  };
  let logQueryBuilder: {
    where: jest.Mock;
    andWhere: jest.Mock;
    orderBy: jest.Mock;
    skip: jest.Mock;
    take: jest.Mock;
    getManyAndCount: jest.Mock;
  };
  let notificationsService: { getNotificationById: jest.Mock };
  let notificationQueueProducer: { enqueueDelayedWebhookRetry: jest.Mock };
  let applicationsService: Record<string, jest.Mock>;
  let providersService: Record<string, jest.Mock>;

  const notification = { id: 1, providerId: 10 };
  const webhook: Partial<Webhook> = {
    id: 100,
    providerId: 10,
    webhookUrl: 'https://partner.example.com/webhook',
    status: Status.ACTIVE,
    lastDeliveryStatus: null,
    lastAttemptedAt: null,
  };

  beforeEach(async () => {
    queryBuilder = {
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    webhookRepository = {
      findOneBy: jest.fn().mockResolvedValue({ ...webhook }),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    };
    logQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    };
    webhookLogRepository = {
      save: jest.fn().mockResolvedValue(undefined),
      createQueryBuilder: jest.fn().mockReturnValue(logQueryBuilder),
    };
    notificationsService = {
      getNotificationById: jest.fn().mockResolvedValue([notification]),
    };
    notificationQueueProducer = {
      enqueueDelayedWebhookRetry: jest.fn().mockResolvedValue(undefined),
    };
    applicationsService = {};
    providersService = {};

    const configValues: Record<string, string> = {
      WEBHOOK_MAX_RETRY_COUNT: '3',
      WEBHOOK_RETRY_INTERVAL: '30m',
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhookService,
        { provide: getRepositoryToken(Webhook), useValue: webhookRepository },
        { provide: getRepositoryToken(WebhookLog), useValue: webhookLogRepository },
        { provide: NotificationsService, useValue: notificationsService },
        { provide: ProvidersService, useValue: providersService },
        { provide: ApplicationsService, useValue: applicationsService },
        { provide: NotificationQueueProducer, useValue: notificationQueueProducer },
        {
          provide: ConfigService,
          useValue: { get: jest.fn((key: string, def?: string) => configValues[key] ?? def) },
        },
      ],
    }).compile();

    service = module.get<WebhookService>(WebhookService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('triggerWebhook', () => {
    it('logs SUCCESS and updates last delivery on a successful attempt', async () => {
      mockedAxios.post.mockResolvedValueOnce({ status: 200, data: { ok: true } });

      await service.triggerWebhook(notification.id, 1);

      expect(webhookLogRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: WebhookDeliveryStatus.SUCCESS,
          attemptNumber: 1,
          requestBody: notification,
        }),
      );
      expect(queryBuilder.set).toHaveBeenCalledWith(
        expect.objectContaining({ lastDeliveryStatus: WebhookDeliveryStatus.SUCCESS }),
      );
      expect(notificationQueueProducer.enqueueDelayedWebhookRetry).not.toHaveBeenCalled();
    });

    it('logs this attempt as FAILED and schedules a delayed re-enqueue when attempts remain', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('ECONNREFUSED'));

      await service.triggerWebhook(notification.id, 1);

      expect(webhookLogRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: WebhookDeliveryStatus.FAILED, attemptNumber: 1 }),
      );
      expect(queryBuilder.set).toHaveBeenCalledWith(
        expect.objectContaining({ lastDeliveryStatus: WebhookDeliveryStatus.FAILED }),
      );
      expect(notificationQueueProducer.enqueueDelayedWebhookRetry).toHaveBeenCalledWith(
        notification,
        2,
        expect.any(Number),
      );
    });

    it('logs FAILED and does not re-enqueue once attempts are exhausted', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('ECONNREFUSED'));

      await service.triggerWebhook(notification.id, 3);

      expect(webhookLogRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: WebhookDeliveryStatus.FAILED, attemptNumber: 3 }),
      );
      expect(queryBuilder.set).toHaveBeenCalledWith(
        expect.objectContaining({ lastDeliveryStatus: WebhookDeliveryStatus.FAILED }),
      );
      expect(notificationQueueProducer.enqueueDelayedWebhookRetry).not.toHaveBeenCalled();
    });

    it('does nothing when no active webhook is registered for the provider', async () => {
      webhookRepository.findOneBy.mockResolvedValueOnce(null);

      await service.triggerWebhook(notification.id, 1);

      expect(mockedAxios.post).not.toHaveBeenCalled();
      expect(webhookLogRepository.save).not.toHaveBeenCalled();
    });

    it('does not crash and does not deliver when the notification no longer exists', async () => {
      notificationsService.getNotificationById.mockResolvedValueOnce([]);

      await expect(service.triggerWebhook(999, 2)).resolves.toBeUndefined();

      expect(webhookRepository.findOneBy).not.toHaveBeenCalled();
      expect(mockedAxios.post).not.toHaveBeenCalled();
      expect(webhookLogRepository.save).not.toHaveBeenCalled();
    });

    it('marks a compensating FAILED entry when scheduling the retry itself fails', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('ECONNREFUSED'));
      notificationQueueProducer.enqueueDelayedWebhookRetry.mockRejectedValueOnce(
        new Error('redis unavailable'),
      );

      await service.triggerWebhook(notification.id, 1);

      // Two FAILED rows for attempt 1: the HTTP failure itself, then a second one recording
      // that the retry couldn't even be scheduled.
      expect(webhookLogRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: WebhookDeliveryStatus.FAILED,
          attemptNumber: 1,
          errorMessage: 'ECONNREFUSED',
        }),
      );
      expect(webhookLogRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: WebhookDeliveryStatus.FAILED,
          attemptNumber: 1,
          errorMessage: expect.stringContaining('Retry scheduling failed'),
        }),
      );
      expect(queryBuilder.set).toHaveBeenLastCalledWith(
        expect.objectContaining({ lastDeliveryStatus: WebhookDeliveryStatus.FAILED }),
      );
    });

    it('does not retry when the delivery succeeded but persisting the log fails', async () => {
      mockedAxios.post.mockResolvedValueOnce({ status: 200, data: { ok: true } });
      webhookLogRepository.save.mockRejectedValueOnce(new Error('db write failed'));

      await expect(service.triggerWebhook(notification.id, 1)).resolves.toBeUndefined();

      expect(mockedAxios.post).toHaveBeenCalledTimes(1);
      expect(notificationQueueProducer.enqueueDelayedWebhookRetry).not.toHaveBeenCalled();
    });
  });

  describe('deactivateWebhooksForProvider', () => {
    it('sets every active webhook for the provider to INACTIVE', async () => {
      const activeWebhooks = [
        { ...webhook, id: 100, status: Status.ACTIVE },
        { ...webhook, id: 101, status: Status.ACTIVE },
      ];

      webhookRepository.find.mockResolvedValueOnce(activeWebhooks);

      await service.deactivateWebhooksForProvider(10);

      expect(webhookRepository.save).toHaveBeenCalledWith([
        expect.objectContaining({ id: 100, status: Status.INACTIVE }),
        expect.objectContaining({ id: 101, status: Status.INACTIVE }),
      ]);
    });

    it('does nothing when the provider has no active webhook', async () => {
      webhookRepository.find.mockResolvedValueOnce([]);

      await service.deactivateWebhooksForProvider(999);

      expect(webhookRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('getWebhookLogsAsDto', () => {
    beforeEach(() => {
      webhookRepository.findOne.mockResolvedValue({
        id: 100,
        providerId: 10,
        status: Status.ACTIVE,
      });
      providersService.getById = jest.fn().mockResolvedValue({ applicationId: 1 });
      applicationsService.findById = jest
        .fn()
        .mockResolvedValue({ applicationId: 1, organizationId: 5 });
    });

    it('scopes results to the webhook', async () => {
      await service.getWebhookLogsAsDto(100, { page: 1, limit: 20 }, 5);

      expect(logQueryBuilder.where).toHaveBeenCalledWith('log.webhookId = :webhookId', {
        webhookId: 100,
      });
    });

    it('applies a free-text search filter across notification ID, error, and payloads when provided', async () => {
      await service.getWebhookLogsAsDto(100, { page: 1, limit: 20, search: 'partner' }, 5);

      expect(logQueryBuilder.andWhere).toHaveBeenCalledTimes(1);
    });

    it('does not apply a search filter when none is provided', async () => {
      await service.getWebhookLogsAsDto(100, { page: 1, limit: 20 }, 5);

      expect(logQueryBuilder.andWhere).not.toHaveBeenCalled();
    });
  });
});
