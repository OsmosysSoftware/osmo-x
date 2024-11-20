import { Test, TestingModule } from '@nestjs/testing';
import { ArchivedNotificationsService } from './archived-notifications.service';

describe('ArchivedNotificationsService', () => {
  let service: ArchivedNotificationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ArchivedNotificationsService],
    }).compile();

    service = module.get<ArchivedNotificationsService>(ArchivedNotificationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
