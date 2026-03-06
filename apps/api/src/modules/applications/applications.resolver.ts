import { Args, Context, Mutation, Resolver, Query } from '@nestjs/graphql';
import { ApplicationsService } from './applications.service';
import { UseGuards } from '@nestjs/common';
import { CreateApplicationInput } from './dto/create-application.input';
import { Application } from './entities/application.entity';
import { QueryOptionsDto } from 'src/common/graphql/dtos/query-options.dto';
import { ApplicationListResponse } from './dto/application-list.dto';
import { GqlAuthGuard } from 'src/common/guards/gql-auth.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/guards/role.guard';
import { UserRoles } from 'src/common/constants/database';
import { UpdateApplicationInput } from './dto/update-application.input';

@Resolver(() => Application)
@Roles(UserRoles.ORG_ADMIN)
@UseGuards(GqlAuthGuard, RolesGuard)
export class ApplicationsResolver {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Mutation(() => Application, { name: 'application' })
  async createApplication(
    @Context() context,
    @Args('createApplicationInput') createApplicationInput: CreateApplicationInput,
  ): Promise<Application> {
    const requestUserId: number = context.req.userId;
    const organizationId: number = context.req.user?.organizationId;
    return await this.applicationsService.createApplication(
      createApplicationInput,
      requestUserId,
      organizationId,
    );
  }

  @Query(() => ApplicationListResponse, { name: 'applications' })
  async findAll(
    @Args('options', { type: () => QueryOptionsDto, nullable: true, defaultValue: {} })
    options: QueryOptionsDto,
  ): Promise<ApplicationListResponse> {
    return this.applicationsService.getAllApplications(options);
  }

  @Mutation(() => Application, { name: 'updateApplication' })
  async updateApplication(
    @Args('updateApplicationInput') updateApplicationInput: UpdateApplicationInput,
  ): Promise<Application> {
    return this.applicationsService.updateApplication(updateApplicationInput);
  }
}
