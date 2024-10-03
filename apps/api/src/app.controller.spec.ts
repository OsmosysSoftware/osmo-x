import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  const response = `🚀✨ You're all set! Everything is up and running smoothly! ✨🚀`;

  describe('root', () => {
    it(`should return "${response}"`, () => {
      expect(appController.getSuccessResponse()).toBe(`'${response}'`);
    });
  });
});
