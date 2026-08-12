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
  let webhookRepository: { findOneBy: jest.Mock; save: jest.Mock };
  let webhookLogRepository: { save: jest.Mock; createQueryBuilder: jest.Mock };
  let notificationQueueProducer: { enqueueDelayedWebhookRetry: jest.Mock };

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
    webhookRepository = {
      findOneBy: jest.fn().mockResolvedValue({ ...webhook }),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
    };
    webhookLogRepository = {
      save: jest.fn().mockResolvedValue(undefined),
      createQueryBuilder: jest.fn(),
    };
    notificationQueueProducer = {
      enqueueDelayedWebhookRetry: jest.fn().mockResolvedValue(undefined),
    };

    const configValues: Record<string, string> = {
      WEBHOOK_MAX_RETRY_COUNT: '3',
      WEBHOOK_RETRY_INTERVAL: '30m',
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhookService,
        { provide: getRepositoryToken(Webhook), useValue: webhookRepository },
        { provide: getRepositoryToken(WebhookLog), useValue: webhookLogRepository },
        {
          provide: NotificationsService,
          useValue: { getNotificationById: jest.fn().mockResolvedValue([notification]) },
        },
        { provide: ProvidersService, useValue: {} },
        { provide: ApplicationsService, useValue: {} },
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
      expect(webhookRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ lastDeliveryStatus: WebhookDeliveryStatus.SUCCESS }),
      );
      expect(notificationQueueProducer.enqueueDelayedWebhookRetry).not.toHaveBeenCalled();
    });

    it('logs RETRYING and schedules a delayed re-enqueue when attempts remain', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('ECONNREFUSED'));

      await service.triggerWebhook(notification.id, 1);

      expect(webhookLogRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: WebhookDeliveryStatus.RETRYING, attemptNumber: 1 }),
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
      expect(webhookRepository.save).toHaveBeenCalledWith(
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
  });
});
