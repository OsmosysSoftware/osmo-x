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
import { ProvidersService } from './providers.service';
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
import { CreateProviderInput } from './dto/create-provider.input';
import { UpdateProviderInput } from './dto/update-provider.input';
import { ProviderResponseDto } from './dto/provider-response.dto';
import { SnakeCaseInterceptor } from 'src/common/interceptors/snake-case.interceptor';
import { resolveOrgId } from 'src/common/utils/org-resolver.helper';

@ApiTags('Providers')
@ApiBearerAuth()
@ApiExtraModels(ProviderResponseDto)
@Controller('providers')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(SnakeCaseInterceptor)
@Roles(UserRoles.ORG_ADMIN)
export class ProvidersController {
  constructor(private readonly providersService: ProvidersService) {}

  @Get()
  @Roles(UserRoles.ORG_USER)
  @ApiOperation({ summary: 'List providers' })
  @ApiQuery({
    name: 'organization_id',
    required: false,
    type: Number,
    description: 'Target org (SUPER_ADMIN only)',
  })
  @ApiQuery({
    name: 'application_id',
    required: false,
    type: Number,
    description: 'Filter by application',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of providers',
    type: PaginatedResponse,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(
    @Query() query: PaginationQueryDto,
    @Query('organization_id') queryOrgId: number,
    @Query('application_id') applicationId: number,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ): Promise<PaginatedResponse<ProviderResponseDto>> {
    const targetOrgId = resolveOrgId(user, queryOrgId);
    const filters = {
      applicationId: applicationId ? Number(applicationId) : undefined,
    };
    const { items, meta } = await this.providersService.getAllProvidersAsDto(
      query,
      targetOrgId,
      filters,
    );
    const { protocol, host } = LinkBuilder.extractBaseUrl(req);
    const links = LinkBuilder.buildCollectionLinks(protocol, host, req.path, meta);

    return new PaginatedResponse(items, links, meta);
  }

  @Get(':id')
  @Roles(UserRoles.ORG_USER)
  @ApiOperation({ summary: 'Get provider by ID' })
  @ApiQuery({
    name: 'organization_id',
    required: false,
    type: Number,
    description: 'Target org (SUPER_ADMIN only)',
  })
  @ApiResponse({ status: 200, description: 'Provider details', type: ProviderResponseDto })
  @ApiResponse({ status: 400, description: 'Provider not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findOne(
    @Param('id') id: number,
    @Query('organization_id') queryOrgId: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<ProviderResponseDto> {
    const targetOrgId = resolveOrgId(user, queryOrgId);

    return this.providersService.findByIdAsDto(id, targetOrgId);
  }

  @Put()
  @ApiOperation({ summary: 'Update an existing provider' })
  @ApiResponse({ status: 200, description: 'Provider updated', type: ProviderResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async update(
    @Body() updateProviderInput: UpdateProviderInput,
    @Body('organizationId') orgId: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<ProviderResponseDto> {
    const targetOrgId = resolveOrgId(user, orgId);

    return this.providersService.updateProviderAsDto(updateProviderInput, targetOrgId, user.userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new provider' })
  @ApiResponse({
    status: 201,
    description: 'Provider created successfully',
    type: ProviderResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @Body() createProviderInput: CreateProviderInput,
    @Body('organizationId') orgId: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<ProviderResponseDto> {
    const targetOrgId = resolveOrgId(user, orgId);

    return this.providersService.createProviderAsDto(createProviderInput, targetOrgId, user.userId);
  }

  @Delete()
  @ApiOperation({ summary: 'Delete a provider' })
  @ApiResponse({ status: 200, description: 'Provider deleted' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async remove(
    @Body('providerId') providerId: number,
    @Body('organizationId') orgId: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<boolean> {
    const targetOrgId = resolveOrgId(user, orgId);

    return this.providersService.softDeleteProviderAsDto(providerId, targetOrgId);
  }
}
