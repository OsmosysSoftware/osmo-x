import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { ApplicationsService } from './applications.service';
import { UseGuards } from '@nestjs/common';
import { ApiKeyGuard } from 'src/common/guards/api-key/api-key.guard';
import { CreateApplicationInput } from './dto/create-application.input';
import { Application } from './entities/application.entity';

@Resolver(() => Application)
@UseGuards(ApiKeyGuard)
export class ApplicationsResolver {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Mutation(() => Application, { name: 'applications' })
  async createApplication(
    @Args('createApplicationInput') createApplicationInput: CreateApplicationInput,
  ): Promise<Application> {
    return await this.applicationsService.createApplication(createApplicationInput);
  }
}
