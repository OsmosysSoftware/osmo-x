import { Test, TestingModule } from '@nestjs/testing';
import { WaTwilioBusinessService } from './wa-twilio-business.service';

describe('WaTwilioBusinessService', () => {
  let service: WaTwilioBusinessService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WaTwilioBusinessService],
    }).compile();

    service = module.get<WaTwilioBusinessService>(WaTwilioBusinessService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
