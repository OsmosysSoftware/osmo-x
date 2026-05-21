import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';

const publishMock = jest.fn();

jest.mock('@aws-sdk/client-sns', () => ({
  SNS: jest.fn().mockImplementation(() => ({
    publish: publishMock,
  })),
}));

jest.mock('../providers.service', () => ({
  ProvidersService: class {},
}));

import { PushSnsService } from './push-sns.service';
import { ProvidersService } from '../providers.service';

describe('PushSnsService', () => {
  let service: PushSnsService;

  const providersServiceMock = {
    getConfigById: jest.fn().mockResolvedValue({
      AWS_ACCESS_KEY_ID: 'test-access-key',
      AWS_SECRET_ACCESS_KEY: 'test-secret-key',
      AWS_REGION: 'us-east-1',
    }),
  };

  beforeEach(async () => {
    publishMock.mockReset();
    publishMock.mockResolvedValue({ MessageId: 'test-message-id' });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PushSnsService,
        { provide: ProvidersService, useValue: providersServiceMock },
        { provide: Logger, useValue: { debug: jest.fn(), log: jest.fn(), error: jest.fn() } },
      ],
    }).compile();

    service = module.get<PushSnsService>(PushSnsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should publish with TargetArn when target is provided', async () => {
    const data = {
      target: 'arn:aws:sns:us-east-1:123456789012:endpoint/GCM/MyApp/abc-123',
      message: { default: 'hello', GCM: '{"notification":{"title":"hi"}}' },
    };

    await service.sendPushNotification(data, 1);

    expect(publishMock).toHaveBeenCalledTimes(1);
    const params = publishMock.mock.calls[0][0];
    expect(params.TargetArn).toBe(data.target);
    expect(params.TopicArn).toBeUndefined();
    expect(params.Message).toBe(JSON.stringify(data.message));
    expect(params.MessageStructure).toBe('json');
  });

  it('should publish with TopicArn when topicArn is provided', async () => {
    const data = {
      topicArn: 'arn:aws:sns:us-east-1:123456789012:oqsha-all-users',
      message: { default: 'hello', GCM: '{"notification":{"title":"hi"}}' },
    };

    await service.sendPushNotification(data, 1);

    expect(publishMock).toHaveBeenCalledTimes(1);
    const params = publishMock.mock.calls[0][0];
    expect(params.TopicArn).toBe(data.topicArn);
    expect(params.TargetArn).toBeUndefined();
    expect(params.Message).toBe(JSON.stringify(data.message));
    expect(params.MessageStructure).toBe('json');
  });
});
