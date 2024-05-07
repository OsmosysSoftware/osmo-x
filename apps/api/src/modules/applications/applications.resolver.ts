import { Args, Context, Mutation, Resolver, Query } from '@nestjs/graphql';
import { ApplicationsService } from './applications.service';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/common/guards/api-key/auth.guard';
import { CreateApplicationInput } from './dto/create-application.input';
import { Application } from './entities/application.entity';
import { QueryOptionsDto } from 'src/common/graphql/dtos/query-options.dto';
import { ApplicationResponse } from './dto/application-response.dto';

@Resolver(() => Application)
@UseGuards(AuthGuard)
export class ApplicationsResolver {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Mutation(() => Application, { name: 'application' })
  async createApplication(
    @Context() context,
    @Args('createApplicationInput') createApplicationInput: CreateApplicationInput,
  ): Promise<Application> {
    const request: Request = context.req;
    const authorizationHeader = request.headers['authorization'];
    return await this.applicationsService.createApplication(
      createApplicationInput,
      authorizationHeader,
    );
  }

  @Query(() => ApplicationResponse, { name: 'applications' })
  async findAll(
    @Context() context,
    @Args('options', { type: () => QueryOptionsDto, nullable: true, defaultValue: {} })
    options: QueryOptionsDto,
  ): Promise<ApplicationResponse> {
    const request: Request = context.req;
    const authorizationHeader = request.headers['authorization'];
    return this.applicationsService.getAllApplications(options, authorizationHeader);
  }
}
