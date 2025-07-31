import { Test, TestingModule } from '@nestjs/testing';
import { ProviderChainMembersController } from './provider-chain-members.controller';

describe('ProviderChainMembersController', () => {
  let controller: ProviderChainMembersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProviderChainMembersController],
    }).compile();

    controller = module.get<ProviderChainMembersController>(ProviderChainMembersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
