import { Test, TestingModule } from '@nestjs/testing';
import { ProviderChainsResolver } from './provider-chains.resolver';

describe('ProviderChainsResolver', () => {
  let resolver: ProviderChainsResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProviderChainsResolver],
    }).compile();

    resolver = module.get<ProviderChainsResolver>(ProviderChainsResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
