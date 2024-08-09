import { Test, TestingModule } from '@nestjs/testing';
import { SmsSnsService } from './sms-sns.service';

describe('SmsSnsService', () => {
  let service: SmsSnsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SmsSnsService],
    }).compile();

    service = module.get<SmsSnsService>(SmsSnsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
