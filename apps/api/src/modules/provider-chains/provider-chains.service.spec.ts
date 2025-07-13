import { Test, TestingModule } from '@nestjs/testing';
import { ProviderChainsService } from './provider-chains.service';

describe('ProviderChainsService', () => {
  let service: ProviderChainsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProviderChainsService],
    }).compile();

    service = module.get<ProviderChainsService>(ProviderChainsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
