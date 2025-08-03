import { Test, TestingModule } from '@nestjs/testing';
import { ProviderChainsController } from './provider-chains.controller';

describe('ProviderChainsController', () => {
  let controller: ProviderChainsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProviderChainsController],
    }).compile();

    controller = module.get<ProviderChainsController>(ProviderChainsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
