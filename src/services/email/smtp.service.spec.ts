import { Test, TestingModule } from '@nestjs/testing';
import { SmtpService } from './smtp.service';

describe('SmtpService', () => {
  let service: SmtpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SmtpService],
    }).compile();

    service = module.get<SmtpService>(SmtpService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
