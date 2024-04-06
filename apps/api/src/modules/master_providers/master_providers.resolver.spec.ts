import { Test, TestingModule } from '@nestjs/testing';
import { MasterProvidersResolver } from './master_providers.resolver';
import { MasterProvidersService } from './master_providers.service';

describe('MasterProvidersResolver', () => {
  let resolver: MasterProvidersResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MasterProvidersResolver, MasterProvidersService],
    }).compile();

    resolver = module.get<MasterProvidersResolver>(MasterProvidersResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
