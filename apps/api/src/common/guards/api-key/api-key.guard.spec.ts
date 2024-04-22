import { ServerApiKeysService } from 'src/modules/server-api-keys/server-api-keys.service';
import { ApiKeyGuard } from './api-key.guard';

describe('ApiKeyGuard', () => {
  it('should be defined', () => {
    // Mock or stub ServerApiKeysService as needed
    const serverApiKeysServiceMock = {} as ServerApiKeysService;
    expect(new ApiKeyGuard(serverApiKeysServiceMock)).toBeDefined();
  });
});
