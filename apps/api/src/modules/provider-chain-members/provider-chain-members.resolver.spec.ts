import { Test, TestingModule } from '@nestjs/testing';
import { ProviderChainMembersResolver } from './provider-chain-members.resolver';

describe('ProviderChainMembersResolver', () => {
  let resolver: ProviderChainMembersResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProviderChainMembersResolver],
    }).compile();

    resolver = module.get<ProviderChainMembersResolver>(ProviderChainMembersResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
