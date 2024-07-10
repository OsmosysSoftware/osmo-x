import { Test, TestingModule } from '@nestjs/testing';
import { PushSnsService } from './push-sns.service';

describe('PushSnsService', () => {
  let service: PushSnsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PushSnsService],
    }).compile();

    service = module.get<PushSnsService>(PushSnsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
