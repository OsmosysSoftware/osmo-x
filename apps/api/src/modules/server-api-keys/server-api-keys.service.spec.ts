import { Test, TestingModule } from '@nestjs/testing';
import { ServerApiKeysService } from './server-api-keys.service';

describe('ServerApiKeysService', () => {
  let service: ServerApiKeysService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ServerApiKeysService],
    }).compile();

    service = module.get<ServerApiKeysService>(ServerApiKeysService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
