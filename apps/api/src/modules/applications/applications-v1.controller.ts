import { Body, Controller, Get, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApplicationsService } from './applications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/role.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRoles } from 'src/common/constants/database';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from 'src/common/constants/jwtInterface';
import { QueryOptionsDto } from 'src/common/graphql/dtos/query-options.dto';
import { CreateApplicationInput } from './dto/create-application.input';
import { UpdateApplicationInput } from './dto/update-application.input';
import { ApplicationResponse } from './dto/application-response.dto';
import { Application } from './entities/application.entity';

@ApiTags('Applications')
@ApiBearerAuth()
@Controller('api/v1/applications')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRoles.ORG_ADMIN)
export class ApplicationsV1Controller {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Get()
  @ApiOperation({ summary: 'List applications' })
  @ApiResponse({ status: 200, description: 'Paginated list of applications' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(@Query() options: QueryOptionsDto): Promise<ApplicationResponse> {
    return this.applicationsService.getAllApplications(options);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new application' })
  @ApiResponse({ status: 201, description: 'Application created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @Body() createApplicationInput: CreateApplicationInput,
    @CurrentUser() user: JwtPayload,
  ): Promise<Application> {
    return this.applicationsService.createApplication(createApplicationInput, user.userId);
  }

  @Put()
  @ApiOperation({ summary: 'Update an existing application' })
  @ApiResponse({ status: 200, description: 'Application updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async update(@Body() updateApplicationInput: UpdateApplicationInput): Promise<Application> {
    return this.applicationsService.updateApplication(updateApplicationInput);
  }
}
