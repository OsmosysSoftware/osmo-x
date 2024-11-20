import { Test, TestingModule } from '@nestjs/testing';
import { ArchivedNotificationsController } from './archived-notifications.controller';

describe('ArchivedNotificationsController', () => {
  let controller: ArchivedNotificationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ArchivedNotificationsController],
    }).compile();

    controller = module.get<ArchivedNotificationsController>(ArchivedNotificationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
