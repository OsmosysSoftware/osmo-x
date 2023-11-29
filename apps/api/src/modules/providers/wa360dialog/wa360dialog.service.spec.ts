import { Test, TestingModule } from '@nestjs/testing';
import { Wa360dialogService } from './wa360dialog.service';

describe('Wa360dialogService', () => {
  let service: Wa360dialogService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [Wa360dialogService],
    }).compile();

    service = module.get<Wa360dialogService>(Wa360dialogService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
