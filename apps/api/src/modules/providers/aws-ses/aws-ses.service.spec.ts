import { Test, TestingModule } from '@nestjs/testing';
import { AwsSesService } from './aws-ses.service';

describe('AwsSesService', () => {
  let service: AwsSesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AwsSesService],
    }).compile();

    service = module.get<AwsSesService>(AwsSesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
