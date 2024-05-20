import { Test, TestingModule } from '@nestjs/testing';
import { SmsKapsystemService } from './sms-kapsystem.service';

describe('SmsKapsystemService', () => {
  let service: SmsKapsystemService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SmsKapsystemService],
    }).compile();

    service = module.get<SmsKapsystemService>(SmsKapsystemService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
