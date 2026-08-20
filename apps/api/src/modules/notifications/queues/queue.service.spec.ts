import { ConfigService } from '@nestjs/config';
import { ChannelType, QueueAction } from 'src/common/constants/notifications';
import { WebhookService } from 'src/modules/webhook/webhook.service';

const pipelineExists = jest.fn();
const pipelineExec = jest.fn();
const clientQuit = jest.fn();
const clientDisconnect = jest.fn();
const clientOn = jest.fn();

jest.mock('ioredis', () => {
  const RedisMock = jest.fn().mockImplementation(() => ({
    on: clientOn,
    quit: clientQuit,
    disconnect: clientDisconnect,
    pipeline: () => ({ exists: pipelineExists, exec: pipelineExec }),
  }));

  return { __esModule: true, default: RedisMock, Redis: RedisMock };
});

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { QueueService } = require('./queue.service');

describe('QueueService.restoreWebhookWorkers', () => {
  const consumerStub = {};

  const buildService = (): InstanceType<typeof QueueService> => {
    const configService = {
      get: jest.fn().mockImplementation((key: string, fallback?: unknown) => {
        if (key === 'REDIS_HOST') {
          return 'localhost';
        }

        if (key === 'REDIS_PORT') {
          return 6379;
        }

        return fallback;
      }),
    } as unknown as ConfigService;

    return new QueueService(
      configService,
      ...Array(11).fill(consumerStub),
      {} as unknown as WebhookService,
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    clientQuit.mockResolvedValue('OK');
  });

  it('returns early without opening a client when there are no providers', async () => {
    const service = buildService();

    await expect(service.restoreWebhookWorkers([])).resolves.toBe(0);
    expect(pipelineExec).not.toHaveBeenCalled();
  });

  it('creates a worker only for providers whose webhook queue still holds jobs', async () => {
    const service = buildService();
    const getOrCreateQueue = jest
      .spyOn(service, 'getOrCreateQueue')
      .mockReturnValue(undefined as never);

    // Provider 5: no keys. Provider 9: a delayed job waiting from before the restart.
    pipelineExec.mockResolvedValue([
      [null, 0],
      [null, 0],
      [null, 0],
      [null, 0],
      [null, 1],
      [null, 0],
      [null, 0],
      [null, 0],
    ]);

    const restored = await service.restoreWebhookWorkers([
      { providerId: 5, channelType: ChannelType.SMTP },
      { providerId: 9, channelType: ChannelType.WA_TWILIO },
    ]);

    expect(restored).toBe(1);
    expect(getOrCreateQueue).toHaveBeenCalledTimes(1);
    expect(getOrCreateQueue).toHaveBeenCalledWith(
      QueueAction.WEBHOOK,
      ChannelType.WA_TWILIO.toString(),
      '9',
    );
    expect(pipelineExists).toHaveBeenCalledWith(
      `bull:${QueueAction.WEBHOOK}-${ChannelType.WA_TWILIO}-9:delayed`,
    );
    expect(clientQuit).toHaveBeenCalled();
  });

  it('ignores entries whose EXISTS command errored', async () => {
    const service = buildService();
    jest.spyOn(service, 'getOrCreateQueue').mockReturnValue(undefined as never);

    pipelineExec.mockResolvedValue([
      [new Error('READONLY'), 1],
      [null, 0],
      [null, 0],
      [null, 0],
    ]);

    await expect(
      service.restoreWebhookWorkers([{ providerId: 5, channelType: ChannelType.SMTP }]),
    ).resolves.toBe(0);
  });

  it('closes the probe client even when the probe fails, and falls back to disconnect', async () => {
    const service = buildService();
    pipelineExec.mockRejectedValue(new Error('connect ETIMEDOUT'));
    clientQuit.mockRejectedValue(new Error('Connection is closed'));

    await expect(
      service.restoreWebhookWorkers([{ providerId: 5, channelType: ChannelType.SMTP }]),
    ).rejects.toThrow('connect ETIMEDOUT');
    expect(clientDisconnect).toHaveBeenCalled();
  });

  it('registers an error listener so ioredis never emits an unhandled error event', async () => {
    const service = buildService();
    jest.spyOn(service, 'getOrCreateQueue').mockReturnValue(undefined as never);
    pipelineExec.mockResolvedValue([
      [null, 0],
      [null, 0],
      [null, 0],
      [null, 0],
    ]);

    await service.restoreWebhookWorkers([{ providerId: 5, channelType: ChannelType.SMTP }]);

    expect(clientOn).toHaveBeenCalledWith('error', expect.any(Function));
  });
});
