import { Test, TestingModule } from '@nestjs/testing';
import { VcTwilioService } from './vc-twilio.service';

describe('VcTwilioService', () => {
  let service: VcTwilioService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VcTwilioService],
    }).compile();

    service = module.get<VcTwilioService>(VcTwilioService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
