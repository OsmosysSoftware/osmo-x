import { Test, TestingModule } from '@nestjs/testing';
import { ServerapikeysService } from './serverapikeys.service';

describe('ServerapikeysService', () => {
  let service: ServerapikeysService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ServerapikeysService],
    }).compile();

    service = module.get<ServerapikeysService>(ServerapikeysService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
