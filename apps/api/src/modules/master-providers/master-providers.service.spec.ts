import { Test, TestingModule } from '@nestjs/testing';
import { MasterProvidersService } from './master-providers.service';

describe('MasterProvidersService', () => {
  let service: MasterProvidersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MasterProvidersService],
    }).compile();

    service = module.get<MasterProvidersService>(MasterProvidersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
