import { Resolver, Query, Args } from '@nestjs/graphql';
import { ApplicationsService } from './applications.service';
import { Application } from './entities/application.entity';
import { Int32 } from 'typeorm';

@Resolver(() => Application)
export class ApplicationsResolver {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Query(() => Application)
  async findApplicationById(
    @Args('applicationId', { type: () => Number }) applicationId: number,
  ): Promise<Application> {
    return this.applicationsService.findById(applicationId);
  }
}
