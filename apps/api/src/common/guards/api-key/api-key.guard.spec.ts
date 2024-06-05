import { ServerApiKeysService } from 'src/modules/server-api-keys/server-api-keys.service';
import { ApiKeyGuard } from './api-key.guard';
import { Logger } from '@nestjs/common';
import { ProvidersService } from 'src/modules/providers/providers.service';

describe('ApiKeyGuard', () => {
  it('should be defined', () => {
    // Mock or stub ServerApiKeysService as needed
    const serverApiKeysServiceMock = {} as ServerApiKeysService;
    const providersServiceMock = {} as ProvidersService;
    const loggerMock = {} as Logger;
    expect(
      new ApiKeyGuard(serverApiKeysServiceMock, providersServiceMock, loggerMock),
    ).toBeDefined();
  });
});
