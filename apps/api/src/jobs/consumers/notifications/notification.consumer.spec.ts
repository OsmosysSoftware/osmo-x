// Break the import cycle: queue.service eagerly imports every per-channel consumer
// (which subclass NotificationConsumer) — stubbing it prevents the circular load.
jest.mock('src/modules/notifications/queues/queue.service', () => ({ QueueService: class {} }));

import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { NotificationConsumer } from './notification.consumer';
import { Notification } from 'src/modules/notifications/entities/notification.entity';
import { RetryNotification } from 'src/modules/notifications/entities/retry-notification.entity';
import { NotificationsService } from 'src/modules/notifications/notifications.service';
import { NotificationQueueProducer } from 'src/jobs/producers/notifications/notifications.job.producer';
import { WebhookService } from 'src/modules/webhook/webhook.service';
import { ProviderChainMembersService } from 'src/modules/provider-chain-members/provider-chain-members.service';
import { ProvidersService } from 'src/modules/providers/providers.service';
import { ChannelType, DeliveryStatus, QueueAction } from 'src/common/constants/notifications';

class TestConsumer extends NotificationConsumer {}

type Mocked<T> = { [K in keyof T]: jest.Mock };

interface ConsumerBundle {
  consumer: TestConsumer;
  notificationRepository: Mocked<Repository<Notification>>;
  notificationRetryRepository: Mocked<Repository<RetryNotification>>;
  notificationsService: Mocked<NotificationsService>;
  notificationQueueService: Mocked<NotificationQueueProducer>;
  providerChainMembersService: Mocked<ProviderChainMembersService>;
  providersService: Mocked<ProvidersService>;
}

function buildConsumer(notificationOnFetch: Notification, maxRetry: number = 3): ConsumerBundle {
  const notificationRepository = {
    save: jest.fn().mockImplementation(async (n) => n),
  } as unknown as Mocked<Repository<Notification>>;

  const notificationRetryRepository = {
    save: jest.fn().mockResolvedValue(undefined),
  } as unknown as Mocked<Repository<RetryNotification>>;

  const notificationsService = {
    getNotificationById: jest.fn().mockResolvedValue([notificationOnFetch]),
  } as unknown as Mocked<NotificationsService>;

  const notificationQueueService = {
    addNotificationToQueue: jest.fn().mockResolvedValue(undefined),
  } as unknown as Mocked<NotificationQueueProducer>;

  const webhookService = {
    triggerWebhook: jest.fn(),
  } as unknown as WebhookService;

  const configService = {
    get: jest.fn().mockReturnValue(maxRetry),
  } as unknown as ConfigService;

  const providerChainMembersService = {
    getNextPriorityProvider: jest.fn(),
  } as unknown as Mocked<ProviderChainMembersService>;

  const providersService = {
    getById: jest.fn(),
  } as unknown as Mocked<ProvidersService>;

  const consumer = new TestConsumer(
    notificationRepository as unknown as Repository<Notification>,
    notificationRetryRepository as unknown as Repository<RetryNotification>,
    notificationsService as unknown as NotificationsService,
    notificationQueueService as unknown as NotificationQueueProducer,
    webhookService,
    configService,
    providerChainMembersService as unknown as ProviderChainMembersService,
    providersService as unknown as ProvidersService,
  );

  return {
    consumer,
    notificationRepository,
    notificationRetryRepository,
    notificationsService,
    notificationQueueService,
    providerChainMembersService,
    providersService,
  };
}

function buildNotification(overrides: Partial<Notification> = {}): Notification {
  const n = new Notification({
    id: overrides.id ?? 1,
    providerId: overrides.providerId ?? 10,
    channelType: overrides.channelType ?? ChannelType.SMS_TWILIO,
    deliveryStatus: overrides.deliveryStatus ?? DeliveryStatus.IN_PROGRESS,
    retryCount: overrides.retryCount ?? 0,
    data: overrides.data ?? {},
    applicationId: overrides.applicationId ?? 100,
  });

  Object.assign(n, overrides);
  return n;
}

describe('NotificationConsumer', () => {
  describe('processNotificationQueue', () => {
    it('skip-confirmation channel: success path sets SUCCESS and enqueues WEBHOOK', async () => {
      // SMTP is in SkipProviderConfirmationChannels
      const notif = buildNotification({ channelType: ChannelType.SMTP });
      const { consumer, notificationRepository, notificationQueueService } = buildConsumer(notif);

      await consumer.processNotificationQueue(notif.id, async () => ({ ok: true }));

      expect(notif.deliveryStatus).toBe(DeliveryStatus.SUCCESS);
      expect(notif.result).toEqual({ result: { ok: true } });
      expect(notificationQueueService.addNotificationToQueue).toHaveBeenCalledWith(
        QueueAction.WEBHOOK,
        notif,
      );
      expect(notificationRepository.save).toHaveBeenCalled();
    });

    it('non-skip channel: success path sets AWAITING_CONFIRMATION and does NOT enqueue WEBHOOK', async () => {
      const notif = buildNotification({ channelType: ChannelType.SMS_TWILIO });
      const { consumer, notificationQueueService } = buildConsumer(notif);

      await consumer.processNotificationQueue(notif.id, async () => ({ sid: 'abc' }));

      expect(notif.deliveryStatus).toBe(DeliveryStatus.AWAITING_CONFIRMATION);
      expect(notificationQueueService.addNotificationToQueue).not.toHaveBeenCalled();
    });

    it('stamps notificationSentOn only on first attempt (retryCount === 0)', async () => {
      const notif = buildNotification({ retryCount: 0 });
      const { consumer } = buildConsumer(notif);

      await consumer.processNotificationQueue(notif.id, async () => ({}));

      expect(notif.notificationSentOn).toBeInstanceOf(Date);
    });

    it('does NOT stamp notificationSentOn when retryCount > 0', async () => {
      const notif = buildNotification({ retryCount: 1 });
      const { consumer } = buildConsumer(notif);

      await consumer.processNotificationQueue(notif.id, async () => ({}));

      expect(notif.notificationSentOn).toBeUndefined();
    });

    it('on error below maxRetry: sets PENDING and increments retryCount', async () => {
      const notif = buildNotification({ retryCount: 0 });
      const { consumer, notificationRetryRepository } = buildConsumer(notif, 3);

      await consumer.processNotificationQueue(notif.id, async () => {
        throw new Error('boom');
      });

      expect(notif.deliveryStatus).toBe(DeliveryStatus.PENDING);
      expect(notif.retryCount).toBe(1);
      // retry attempts recorded
      expect(notificationRetryRepository.save).toHaveBeenCalled();
    });

    it('on error at maxRetry: sets FAILED and enqueues WEBHOOK when no providerChain', async () => {
      const notif = buildNotification({ retryCount: 3, providerChainId: undefined });
      const { consumer, notificationQueueService } = buildConsumer(notif, 3);

      await consumer.processNotificationQueue(notif.id, async () => {
        throw new Error('boom');
      });

      expect(notif.deliveryStatus).toBe(DeliveryStatus.FAILED);
      expect(notificationQueueService.addNotificationToQueue).toHaveBeenCalledWith(
        QueueAction.WEBHOOK,
        notif,
      );
    });

    it('on error at maxRetry with providerChain: fails over to next provider, resets retryCount, sets PENDING', async () => {
      const notif = buildNotification({
        retryCount: 3,
        providerChainId: 7,
        providerId: 10,
        channelType: ChannelType.SMS_TWILIO,
      });
      const { consumer, providerChainMembersService, providersService } = buildConsumer(notif, 3);
      providerChainMembersService.getNextPriorityProvider.mockResolvedValue(22);
      providersService.getById.mockResolvedValue({
        providerId: 22,
        channelType: ChannelType.SMS_PLIVO,
      });

      await consumer.processNotificationQueue(notif.id, async () => {
        throw new Error('boom');
      });

      expect(providerChainMembersService.getNextPriorityProvider).toHaveBeenCalledWith(7, 10);
      expect(providersService.getById).toHaveBeenCalledWith(22);
      expect(notif.providerId).toBe(22);
      expect(notif.channelType).toBe(ChannelType.SMS_PLIVO);
      expect(notif.retryCount).toBe(0);
      expect(notif.deliveryStatus).toBe(DeliveryStatus.PENDING);
    });

    it('failover with no next provider: remains FAILED', async () => {
      const notif = buildNotification({ retryCount: 3, providerChainId: 7 });
      const { consumer, providerChainMembersService } = buildConsumer(notif, 3);
      providerChainMembersService.getNextPriorityProvider.mockResolvedValue(null);

      await consumer.processNotificationQueue(notif.id, async () => {
        throw new Error('boom');
      });

      expect(notif.deliveryStatus).toBe(DeliveryStatus.FAILED);
    });
  });

  describe('processAwaitingConfirmationNotificationQueue', () => {
    it('provider says SUCCESS: enqueues WEBHOOK', async () => {
      const notif = buildNotification({
        channelType: ChannelType.SMS_TWILIO,
        deliveryStatus: DeliveryStatus.AWAITING_CONFIRMATION,
      });
      const { consumer, notificationQueueService } = buildConsumer(notif);

      await consumer.processAwaitingConfirmationNotificationQueue(notif.id, async () => ({
        result: { status: 'delivered' },
        deliveryStatus: DeliveryStatus.SUCCESS,
      }));

      expect(notif.deliveryStatus).toBe(DeliveryStatus.SUCCESS);
      expect(notificationQueueService.addNotificationToQueue).toHaveBeenCalledWith(
        QueueAction.WEBHOOK,
        notif,
      );
    });

    it('provider says PENDING under retry budget: increments retryCount and persists', async () => {
      const notif = buildNotification({ retryCount: 0 });
      const { consumer } = buildConsumer(notif, 3);

      await consumer.processAwaitingConfirmationNotificationQueue(notif.id, async () => ({
        result: { status: 'queued' },
        deliveryStatus: DeliveryStatus.PENDING,
      }));

      expect(notif.deliveryStatus).toBe(DeliveryStatus.PENDING);
      expect(notif.retryCount).toBe(1);
    });

    it('provider says PENDING at max retry: throws internally, falls through to FAILED branch', async () => {
      const notif = buildNotification({ retryCount: 3, providerChainId: undefined });
      const { consumer, notificationQueueService } = buildConsumer(notif, 3);

      await consumer.processAwaitingConfirmationNotificationQueue(notif.id, async () => ({
        result: { status: 'queued' },
        deliveryStatus: DeliveryStatus.PENDING,
      }));

      expect(notif.deliveryStatus).toBe(DeliveryStatus.FAILED);
      expect(notificationQueueService.addNotificationToQueue).toHaveBeenCalledWith(
        QueueAction.WEBHOOK,
        notif,
      );
    });

    it('error below max retry: sets AWAITING_CONFIRMATION and increments retryCount', async () => {
      const notif = buildNotification({ retryCount: 0 });
      const { consumer } = buildConsumer(notif, 3);

      await consumer.processAwaitingConfirmationNotificationQueue(notif.id, async () => {
        throw new Error('boom');
      });

      expect(notif.deliveryStatus).toBe(DeliveryStatus.AWAITING_CONFIRMATION);
      expect(notif.retryCount).toBe(1);
    });

    it('error at max retry with providerChain: fails over, resets retry, sets PENDING', async () => {
      const notif = buildNotification({
        retryCount: 3,
        providerChainId: 7,
        providerId: 10,
      });
      const { consumer, providerChainMembersService, providersService } = buildConsumer(notif, 3);
      providerChainMembersService.getNextPriorityProvider.mockResolvedValue(22);
      providersService.getById.mockResolvedValue({
        providerId: 22,
        channelType: ChannelType.MAILGUN,
      });

      await consumer.processAwaitingConfirmationNotificationQueue(notif.id, async () => {
        throw new Error('upstream timeout');
      });

      expect(notif.providerId).toBe(22);
      expect(notif.channelType).toBe(ChannelType.MAILGUN);
      expect(notif.retryCount).toBe(0);
      expect(notif.deliveryStatus).toBe(DeliveryStatus.PENDING);
    });

    it('saves retry attempt when retryCount > 0 in finally block', async () => {
      const notif = buildNotification({ retryCount: 0 });
      const { consumer, notificationRetryRepository } = buildConsumer(notif, 3);

      await consumer.processAwaitingConfirmationNotificationQueue(notif.id, async () => {
        throw new Error('boom');
      });

      // catch + finally both call saveRetryAttempt
      expect(notificationRetryRepository.save).toHaveBeenCalledTimes(2);
    });
  });
});
