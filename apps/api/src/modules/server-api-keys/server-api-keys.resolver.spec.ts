import { Test, TestingModule } from '@nestjs/testing';
import { ServerApiKeysResolver } from './server-api-keys.resolver';
import { ServerApiKeysService } from './server-api-keys.service';

describe('ServerApiKeysResolver', () => {
  let resolver: ServerApiKeysResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ServerApiKeysResolver, ServerApiKeysService],
    }).compile();

    resolver = module.get<ServerApiKeysResolver>(ServerApiKeysResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
