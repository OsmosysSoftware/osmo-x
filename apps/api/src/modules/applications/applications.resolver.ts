import { Args, Context, Mutation, Resolver, Query } from '@nestjs/graphql';
import { ApplicationsService } from './applications.service';
import { UseGuards } from '@nestjs/common';
import { CreateApplicationInput } from './dto/create-application.input';
import { Application } from './entities/application.entity';
import { QueryOptionsDto } from 'src/common/graphql/dtos/query-options.dto';
import { ApplicationResponse } from './dto/application-response.dto';
import { GqlAuthGuard } from 'src/common/guards/api-key/gql-auth.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/guards/role.guard';
import { UserRoles } from 'src/common/constants/database';

@Resolver(() => Application)
@Roles(UserRoles.ADMIN)
@UseGuards(GqlAuthGuard, RolesGuard)
export class ApplicationsResolver {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Mutation(() => Application, { name: 'application' })
  async createApplication(
    @Context() context,
    @Args('createApplicationInput') createApplicationInput: CreateApplicationInput,
  ): Promise<Application> {
    const requestUserId: number = context.req.userId;
    return await this.applicationsService.createApplication(createApplicationInput, requestUserId);
  }

  @Query(() => ApplicationResponse, { name: 'applications' })
  async findAll(
    @Args('options', { type: () => QueryOptionsDto, nullable: true, defaultValue: {} })
    options: QueryOptionsDto,
  ): Promise<ApplicationResponse> {
    return this.applicationsService.getAllApplications(options);
  }
}
