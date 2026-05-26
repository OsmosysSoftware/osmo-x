jest.mock('axios');

import axios from 'axios';
import { Repository } from 'typeorm';
import { WebhookService } from './webhook.service';
import { Webhook } from './entities/webhook.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { ProvidersService } from '../providers/providers.service';
import { ApplicationsService } from '../applications/applications.service';
import { Status } from 'src/common/constants/database';

type Mocked<T> = { [K in keyof T]: jest.Mock };

interface Bundle {
  service: WebhookService;
  webhookRepository: Mocked<Repository<Webhook>>;
  notificationsService: Mocked<NotificationsService>;
}

function buildService(notification: unknown, webhook: Webhook | null = null): Bundle {
  const webhookRepository = {
    findOneBy: jest.fn().mockResolvedValue(webhook),
    findOne: jest.fn(),
    find: jest.fn(),
    findAndCount: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  } as unknown as Mocked<Repository<Webhook>>;

  const notificationsService = {
    getNotificationById: jest.fn().mockResolvedValue([notification]),
  } as unknown as Mocked<NotificationsService>;

  const providersService = {
    getById: jest.fn(),
  } as unknown as ProvidersService;

  const applicationsService = {
    findById: jest.fn(),
    getApplicationIdsByOrganization: jest.fn(),
  } as unknown as ApplicationsService;

  const service = new WebhookService(
    webhookRepository as unknown as Repository<Webhook>,
    notificationsService as unknown as NotificationsService,
    providersService,
    applicationsService,
  );

  return { service, webhookRepository, notificationsService };
}

describe('WebhookService', () => {
  describe('triggerWebhook', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      // Make sleep return immediately so tests don't have to wait through the
      // 2-4-8-16-32 second exponential backoff schedule.
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('looks up notification by id and webhook by notification.providerId', async () => {
      const webhook = { providerId: 10, webhookUrl: 'https://h.example/cb' } as Webhook;
      const notification = { id: 1, providerId: 10 };
      const { service, notificationsService, webhookRepository } = buildService(
        notification,
        webhook,
      );
      (axios.post as jest.Mock).mockResolvedValue({ data: { ok: true } });

      await service.triggerWebhook(1);

      expect(notificationsService.getNotificationById).toHaveBeenCalledWith(1);
      expect(webhookRepository.findOneBy).toHaveBeenCalledWith({
        providerId: 10,
        status: Status.ACTIVE,
      });
    });

    it('returns early without retrying when no active webhook exists', async () => {
      const { service, webhookRepository } = buildService({ id: 1, providerId: 10 }, null);
      (axios.post as jest.Mock).mockResolvedValue({ data: { ok: true } });

      await service.triggerWebhook(1);

      // Only the first lookup happens; the `break` short-circuits the retry loop.
      expect(webhookRepository.findOneBy).toHaveBeenCalledTimes(1);
      expect(axios.post).not.toHaveBeenCalled();
    });

    it('POSTs the notification object as the body to the webhook URL on success', async () => {
      const webhook = { providerId: 10, webhookUrl: 'https://h.example/cb' } as Webhook;
      const notification = { id: 1, providerId: 10, data: { foo: 'bar' } };
      const { service } = buildService(notification, webhook);
      (axios.post as jest.Mock).mockResolvedValue({ data: { ok: true } });

      await service.triggerWebhook(1);

      expect(axios.post).toHaveBeenCalledWith('https://h.example/cb', notification, {
        headers: { 'Content-Type': 'application/json' },
      });
      // Single attempt on first success
      expect(axios.post).toHaveBeenCalledTimes(1);
    });

    it('retries up to 5 times on failures and re-reads the webhook each attempt', async () => {
      const webhook = { providerId: 10, webhookUrl: 'https://h.example/cb' } as Webhook;
      const { service, webhookRepository } = buildService({ id: 1, providerId: 10 }, webhook);
      (axios.post as jest.Mock).mockRejectedValue(new Error('network down'));

      const promise = service.triggerWebhook(1);
      // Advance through the 2^1+2^2+2^3+2^4+2^5 = 62 seconds of total backoff
      await jest.advanceTimersByTimeAsync(62_000);
      await promise;

      expect(axios.post).toHaveBeenCalledTimes(5);
      expect(webhookRepository.findOneBy).toHaveBeenCalledTimes(5);
    });

    it('does not throw when max retries are exhausted', async () => {
      const webhook = { providerId: 10, webhookUrl: 'https://h.example/cb' } as Webhook;
      const { service } = buildService({ id: 1, providerId: 10 }, webhook);
      (axios.post as jest.Mock).mockRejectedValue(new Error('boom'));

      const promise = service.triggerWebhook(1);
      await jest.advanceTimersByTimeAsync(62_000);

      await expect(promise).resolves.toBeUndefined();
    });

    it('returns after first successful POST without further attempts', async () => {
      const webhook = { providerId: 10, webhookUrl: 'https://h.example/cb' } as Webhook;
      const { service } = buildService({ id: 1, providerId: 10 }, webhook);
      (axios.post as jest.Mock)
        .mockRejectedValueOnce(new Error('flake'))
        .mockResolvedValueOnce({ data: { ok: true } });

      const promise = service.triggerWebhook(1);
      await jest.advanceTimersByTimeAsync(10_000);
      await promise;

      expect(axios.post).toHaveBeenCalledTimes(2);
    });
  });
});
