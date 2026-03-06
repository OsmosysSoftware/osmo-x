import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ApplicationsService } from './applications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/role.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRoles } from 'src/common/constants/database';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from 'src/common/constants/jwtInterface';
import { Request } from 'express';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { PaginatedResponse } from 'src/common/dto/paginated-response.dto';
import { LinkBuilder } from 'src/common/utils/link-builder.helper';
import { CreateApplicationInput } from './dto/create-application.input';
import { UpdateApplicationInput } from './dto/update-application.input';
import { ApplicationResponseDto } from './dto/application-response.dto';
import { SnakeCaseInterceptor } from 'src/common/interceptors/snake-case.interceptor';
import { resolveOrgId } from 'src/common/utils/org-resolver.helper';

@ApiTags('Applications')
@ApiBearerAuth()
@ApiExtraModels(ApplicationResponseDto)
@Controller('applications')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(SnakeCaseInterceptor)
@Roles(UserRoles.ORG_ADMIN)
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Get()
  @Roles(UserRoles.ORG_USER)
  @ApiOperation({ summary: 'List applications' })
  @ApiQuery({
    name: 'organization_id',
    required: false,
    type: Number,
    description: 'Target org (SUPER_ADMIN only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of applications',
    type: PaginatedResponse,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(
    @Query() query: PaginationQueryDto,
    @Query('organization_id') queryOrgId: number,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ): Promise<PaginatedResponse<ApplicationResponseDto>> {
    const targetOrgId = resolveOrgId(user, queryOrgId);
    const { items, meta } = await this.applicationsService.getAllApplicationsAsDto(
      query,
      targetOrgId,
    );
    const { protocol, host } = LinkBuilder.extractBaseUrl(req);
    const links = LinkBuilder.buildCollectionLinks(protocol, host, req.path, meta);

    return new PaginatedResponse(items, links, meta);
  }

  @Get(':id')
  @Roles(UserRoles.ORG_USER)
  @ApiOperation({ summary: 'Get application by ID' })
  @ApiQuery({
    name: 'organization_id',
    required: false,
    type: Number,
    description: 'Target org (SUPER_ADMIN only)',
  })
  @ApiResponse({ status: 200, description: 'Application details', type: ApplicationResponseDto })
  @ApiResponse({ status: 400, description: 'Application not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findOne(
    @Param('id') id: number,
    @Query('organization_id') queryOrgId: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<ApplicationResponseDto> {
    const targetOrgId = resolveOrgId(user, queryOrgId);

    return this.applicationsService.findByIdAsDto(id, targetOrgId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new application' })
  @ApiResponse({
    status: 201,
    description: 'Application created successfully',
    type: ApplicationResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @Body() createApplicationInput: CreateApplicationInput,
    @Body('organizationId') orgId: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<ApplicationResponseDto> {
    const targetOrgId = resolveOrgId(user, orgId);

    return this.applicationsService.createApplicationAsDto(
      createApplicationInput,
      user.userId,
      targetOrgId,
    );
  }

  @Delete()
  @ApiOperation({ summary: 'Delete an application (soft delete)' })
  @ApiResponse({ status: 200, description: 'Application deleted successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async remove(
    @Body('applicationId') applicationId: number,
    @Body('organizationId') orgId: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<boolean> {
    const targetOrgId = resolveOrgId(user, orgId);

    return this.applicationsService.softDeleteApplicationAsDto(applicationId, targetOrgId);
  }

  @Put()
  @ApiOperation({ summary: 'Update an existing application' })
  @ApiResponse({
    status: 200,
    description: 'Application updated successfully',
    type: ApplicationResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async update(
    @Body() updateApplicationInput: UpdateApplicationInput,
    @Body('organizationId') orgId: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<ApplicationResponseDto> {
    const targetOrgId = resolveOrgId(user, orgId);

    return this.applicationsService.updateApplicationAsDto(
      updateApplicationInput,
      targetOrgId,
      user.userId,
    );
  }
}
