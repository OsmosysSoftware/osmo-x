import { Test, TestingModule } from '@nestjs/testing';
import { ArchivedNotificationsResolver } from './archived-notifications.resolver';

describe('ArchivedNotificationsResolver', () => {
  let resolver: ArchivedNotificationsResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ArchivedNotificationsResolver],
    }).compile();

    resolver = module.get<ArchivedNotificationsResolver>(ArchivedNotificationsResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
