import { Test, TestingModule } from '@nestjs/testing';
import { ApplicationsResolver } from './applications.resolver';

describe('ApplicationsResolver', () => {
  let resolver: ApplicationsResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ApplicationsResolver],
    }).compile();

    resolver = module.get<ApplicationsResolver>(ApplicationsResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
