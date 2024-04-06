import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { ApplicationsService } from './applications.service';
import { Application } from './entities/application.entity';
import { CreateApplicationInput } from './dto/create-application.input';
import { UpdateApplicationInput } from './dto/update-application.input';

@Resolver(() => Application)
export class ApplicationsResolver {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Mutation(() => Application)
  createApplication(
    @Args('createApplicationInput') createApplicationInput: CreateApplicationInput,
  ) {
    return this.applicationsService.create(createApplicationInput);
  }

  @Query(() => [Application], { name: 'applications' })
  findAll() {
    return this.applicationsService.findAll();
  }

  @Query(() => Application, { name: 'application' })
  findOne(@Args('id', { type: () => Int }) id: number) {
    return this.applicationsService.findOne(id);
  }

  @Mutation(() => Application)
  updateApplication(
    @Args('updateApplicationInput') updateApplicationInput: UpdateApplicationInput,
  ) {
    return this.applicationsService.update(updateApplicationInput.id, updateApplicationInput);
  }

  @Mutation(() => Application)
  removeApplication(@Args('id', { type: () => Int }) id: number) {
    return this.applicationsService.remove(id);
  }
}
