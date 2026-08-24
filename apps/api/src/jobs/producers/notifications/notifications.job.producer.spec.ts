import { Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import { NotificationQueueProducer } from './notifications.job.producer';
import { Notification } from 'src/modules/notifications/entities/notification.entity';
import { IQueueService } from 'src/modules/notifications/queues/queue.tokens';
import { ProvidersService } from 'src/modules/providers/providers.service';
import { ChannelType, QueueAction } from 'src/common/constants/notifications';

describe('NotificationQueueProducer (delayed webhook retries)', () => {
  let queue: { add: jest.Mock; getJob: jest.Mock };
  let queueService: { getOrCreateQueue: jest.Mock };
  let providersService: { getById: jest.Mock };
  let producer: NotificationQueueProducer;

  const buildNotification = (updatedOn: Date | undefined): Notification =>
    ({ id: 42, providerId: 5, updatedOn }) as Notification;

  beforeEach(() => {
    queue = { add: jest.fn().mockResolvedValue({ id: 'job' }), getJob: jest.fn() };
    queueService = { getOrCreateQueue: jest.fn().mockReturnValue(queue as unknown as Queue) };
    providersService = {
      getById: jest.fn().mockResolvedValue({ providerId: 5, channelType: ChannelType.SMTP }),
    };
    producer = new NotificationQueueProducer(
      queueService as unknown as IQueueService,
      providersService as unknown as ProvidersService,
    );
  });

  it('discriminates the jobId by the notification updatedOn and the attempt number', async () => {
    const updatedOn = new Date('2026-08-20T10:00:00.000Z');

    await producer.enqueueDelayedWebhookRetry(buildNotification(updatedOn), 2, 1000);

    expect(queueService.getOrCreateQueue).toHaveBeenCalledWith(
      QueueAction.WEBHOOK,
      ChannelType.SMTP.toString(),
      '5',
    );

    const expectedJobId = `42-${updatedOn.getTime()}-attempt-2`;
    expect(queue.add).toHaveBeenCalledWith(
      expectedJobId,
      { id: 42, providerId: 5, attempt: 2 },
      { delay: 1000, jobId: expectedJobId },
    );
  });

  it('produces a different jobId for a later delivery run of the same notification and attempt', async () => {
    await producer.enqueueDelayedWebhookRetry(
      buildNotification(new Date('2026-08-20T10:00:00.000Z')),
      2,
      1000,
    );
    await producer.enqueueDelayedWebhookRetry(
      buildNotification(new Date('2026-08-20T11:00:00.000Z')),
      2,
      1000,
    );

    const [firstJobId] = queue.add.mock.calls[0];
    const [secondJobId] = queue.add.mock.calls[1];

    expect(firstJobId).not.toEqual(secondJobId);
  });

  it('warns when the jobId already exists so a deduplicated retry is not silent', async () => {
    queue.getJob.mockResolvedValue({ id: 'existing' });

    const warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);

    await producer.enqueueDelayedWebhookRetry(
      buildNotification(new Date('2026-08-20T10:00:00.000Z')),
      2,
      1000,
    );

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('already exists in Redis'));

    warn.mockRestore();
  });

  it('falls back to a wall-clock discriminator when updatedOn is missing', async () => {
    await producer.enqueueDelayedWebhookRetry(buildNotification(undefined), 3, 1000);

    const [jobId] = queue.add.mock.calls[0];

    expect(jobId).toMatch(/^42-\d+-attempt-3$/);
  });
});
