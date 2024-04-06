import { Test, TestingModule } from '@nestjs/testing';
import { ServerapikeysResolver } from './serverapikeys.resolver';
import { ServerapikeysService } from './serverapikeys.service';

describe('ServerapikeysResolver', () => {
  let resolver: ServerapikeysResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ServerapikeysResolver, ServerapikeysService],
    }).compile();

    resolver = module.get<ServerapikeysResolver>(ServerapikeysResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
