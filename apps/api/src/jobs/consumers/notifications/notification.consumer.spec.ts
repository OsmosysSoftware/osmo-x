import { Repository } from 'typeorm';
import { NotificationConsumer } from './notification.consumer';
import { Notification } from 'src/modules/notifications/entities/notification.entity';
import { RetryNotification } from 'src/modules/notifications/entities/retry-notification.entity';
import { NotificationsService } from 'src/modules/notifications/notifications.service';
import { NotificationQueueProducer } from 'src/jobs/producers/notifications/notifications.job.producer';
import { WebhookService } from 'src/modules/webhook/webhook.service';
import { ConfigService } from '@nestjs/config';
import { ProviderChainMembersService } from 'src/modules/provider-chain-members/provider-chain-members.service';
import { ProvidersService } from 'src/modules/providers/providers.service';
import { ChannelType, DeliveryStatus, QueueAction } from 'src/common/constants/notifications';

class TestConsumer extends NotificationConsumer {}

describe('NotificationConsumer (webhook enqueue ordering)', () => {
  let notificationRepository: { save: jest.Mock };
  let notificationRetryRepository: { save: jest.Mock };
  let notificationsService: { getNotificationById: jest.Mock };
  let notificationQueueService: { addNotificationToQueue: jest.Mock };
  let providerChainMembersService: { getNextPriorityProvider: jest.Mock };
  let providersService: { getById: jest.Mock };
  let callOrder: string[];
  let enqueuedNotification: Notification | undefined;

  const buildConsumer = (): TestConsumer =>
    new TestConsumer(
      notificationRepository as unknown as Repository<Notification>,
      notificationRetryRepository as unknown as Repository<RetryNotification>,
      notificationsService as unknown as NotificationsService,
      notificationQueueService as unknown as NotificationQueueProducer,
      {} as unknown as WebhookService,
      { get: jest.fn().mockReturnValue(3) } as unknown as ConfigService,
      providerChainMembersService as unknown as ProviderChainMembersService,
      providersService as unknown as ProvidersService,
    );

  beforeEach(() => {
    callOrder = [];
    enqueuedNotification = undefined;

    notificationRepository = {
      save: jest.fn().mockImplementation((notification) => {
        callOrder.push('save');
        return Promise.resolve(notification);
      }),
    };
    notificationRetryRepository = { save: jest.fn().mockResolvedValue(undefined) };
    notificationQueueService = {
      addNotificationToQueue: jest.fn().mockImplementation((action, notification) => {
        callOrder.push('enqueue');
        enqueuedNotification = notification;
        return Promise.resolve();
      }),
    };
    providerChainMembersService = { getNextPriorityProvider: jest.fn().mockResolvedValue(null) };
    providersService = { getById: jest.fn().mockResolvedValue({ maxRetryCount: null }) };
  });

  it('processNotificationQueue: enqueues webhook only after the final save, with result populated (skip-confirmation success)', async () => {
    const notification = {
      id: 1,
      providerId: 5,
      channelType: ChannelType.SMTP,
      retryCount: 0,
    } as Notification;

    notificationsService = { getNotificationById: jest.fn().mockResolvedValue([notification]) };

    const consumer = buildConsumer();

    await consumer.processNotificationQueue(1, async () => ({ messageId: 'abc' }));

    expect(notificationRepository.save).toHaveBeenCalledTimes(1);
    expect(notificationQueueService.addNotificationToQueue).toHaveBeenCalledWith(
      QueueAction.WEBHOOK,
      expect.objectContaining({ deliveryStatus: DeliveryStatus.SUCCESS }),
    );
    expect(callOrder).toEqual(['save', 'enqueue']);
    expect(enqueuedNotification?.result).toBeDefined();
  });

  it('processNotificationQueue: enqueues webhook only after the final save, with result populated (retries exhausted)', async () => {
    const notification = {
      id: 2,
      providerId: 5,
      channelType: ChannelType.WA_TWILIO,
      retryCount: 3,
      providerChainId: null,
    } as Notification;

    notificationsService = { getNotificationById: jest.fn().mockResolvedValue([notification]) };

    const consumer = buildConsumer();

    await consumer.processNotificationQueue(2, async () => {
      throw new Error('provider unreachable');
    });

    expect(notificationRepository.save).toHaveBeenCalledTimes(1);
    expect(notificationQueueService.addNotificationToQueue).toHaveBeenCalledWith(
      QueueAction.WEBHOOK,
      expect.objectContaining({ deliveryStatus: DeliveryStatus.FAILED }),
    );
    expect(callOrder).toEqual(['save', 'enqueue']);
    expect(enqueuedNotification?.result).toBeDefined();
  });

  it('processAwaitingConfirmationNotificationQueue: enqueues webhook only after the final save (confirmed success)', async () => {
    const notification = {
      id: 3,
      providerId: 5,
      channelType: ChannelType.WA_TWILIO,
      retryCount: 0,
    } as Notification;

    notificationsService = { getNotificationById: jest.fn().mockResolvedValue([notification]) };

    const consumer = buildConsumer();

    await consumer.processAwaitingConfirmationNotificationQueue(3, async () => ({
      result: { status: 'delivered' },
      deliveryStatus: DeliveryStatus.SUCCESS,
    }));

    expect(notificationRepository.save).toHaveBeenCalledTimes(1);
    expect(notificationQueueService.addNotificationToQueue).toHaveBeenCalledWith(
      QueueAction.WEBHOOK,
      expect.objectContaining({ deliveryStatus: DeliveryStatus.SUCCESS }),
    );
    expect(callOrder).toEqual(['save', 'enqueue']);
    expect(enqueuedNotification?.result).toBeDefined();
  });

  it('processAwaitingConfirmationNotificationQueue: enqueues webhook only after the final save (retries exhausted)', async () => {
    // Seeded with a result from a prior confirmation attempt: this catch branch doesn't set
    // .result itself (only the try-block success path does), so a fresh/undefined result here
    // would just reflect that this is the first-ever attempt, not prove anything about ordering.
    const notification = {
      id: 4,
      providerId: 5,
      channelType: ChannelType.WA_TWILIO,
      retryCount: 3,
      providerChainId: null,
      result: { result: { status: 'awaiting_confirmation' } },
    } as unknown as Notification;

    notificationsService = { getNotificationById: jest.fn().mockResolvedValue([notification]) };

    const consumer = buildConsumer();

    await consumer.processAwaitingConfirmationNotificationQueue(4, async () => {
      throw new Error('provider status check failed');
    });

    expect(notificationRepository.save).toHaveBeenCalledTimes(1);
    expect(notificationQueueService.addNotificationToQueue).toHaveBeenCalledWith(
      QueueAction.WEBHOOK,
      expect.objectContaining({ deliveryStatus: DeliveryStatus.FAILED }),
    );
    expect(callOrder).toEqual(['save', 'enqueue']);
    expect(enqueuedNotification?.result).toEqual(notification.result);
  });
});
