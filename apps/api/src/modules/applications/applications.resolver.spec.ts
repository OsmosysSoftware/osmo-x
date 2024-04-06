import { Test, TestingModule } from '@nestjs/testing';
import { ApplicationsResolver } from './applications.resolver';
import { ApplicationsService } from './applications.service';

describe('ApplicationsResolver', () => {
  let resolver: ApplicationsResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ApplicationsResolver, ApplicationsService],
    }).compile();

    resolver = module.get<ApplicationsResolver>(ApplicationsResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
