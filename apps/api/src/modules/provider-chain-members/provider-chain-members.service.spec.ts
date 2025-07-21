import { Test, TestingModule } from '@nestjs/testing';
import { ProviderChainMembersService } from './provider-chain-members.service';

describe('ProviderChainMembersService', () => {
  let service: ProviderChainMembersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProviderChainMembersService],
    }).compile();

    service = module.get<ProviderChainMembersService>(ProviderChainMembersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
