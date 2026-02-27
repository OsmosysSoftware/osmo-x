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
import { ApiBearerAuth, ApiExtraModels, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
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

@ApiTags('Applications')
@ApiBearerAuth()
@ApiExtraModels(ApplicationResponseDto)
@Controller('api/v1/applications')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(SnakeCaseInterceptor)
@Roles(UserRoles.ORG_ADMIN)
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Get()
  @ApiOperation({ summary: 'List applications' })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of applications',
    type: PaginatedResponse,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(
    @Query() query: PaginationQueryDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ): Promise<PaginatedResponse<ApplicationResponseDto>> {
    const { items, meta } = await this.applicationsService.getAllApplicationsAsDto(
      query,
      user.organizationId,
    );
    const { protocol, host } = LinkBuilder.extractBaseUrl(req);
    const links = LinkBuilder.buildCollectionLinks(protocol, host, req.path, meta);

    return new PaginatedResponse(items, links, meta);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get application by ID' })
  @ApiResponse({ status: 200, description: 'Application details', type: ApplicationResponseDto })
  @ApiResponse({ status: 400, description: 'Application not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findOne(
    @Param('id') id: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<ApplicationResponseDto> {
    return this.applicationsService.findByIdAsDto(id, user.organizationId);
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
    @CurrentUser() user: JwtPayload,
  ): Promise<ApplicationResponseDto> {
    return this.applicationsService.createApplicationAsDto(
      createApplicationInput,
      user.userId,
      user.organizationId,
    );
  }

  @Delete()
  @ApiOperation({ summary: 'Delete an application (soft delete)' })
  @ApiResponse({ status: 200, description: 'Application deleted successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async remove(
    @Body('applicationId') applicationId: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<boolean> {
    return this.applicationsService.softDeleteApplicationAsDto(applicationId, user.organizationId);
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
    @CurrentUser() user: JwtPayload,
  ): Promise<ApplicationResponseDto> {
    return this.applicationsService.updateApplicationAsDto(
      updateApplicationInput,
      user.organizationId,
      user.userId,
    );
  }
}
