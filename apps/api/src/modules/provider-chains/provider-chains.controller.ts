import {
  Body,
  Controller,
  Delete,
  Get,
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
import { ProviderChainsService } from './provider-chains.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/role.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRoles } from 'src/common/constants/database';
import { Request } from 'express';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { PaginatedResponse } from 'src/common/dto/paginated-response.dto';
import { LinkBuilder } from 'src/common/utils/link-builder.helper';
import { CreateProviderChainInput } from './dto/create-provider-chain.input';
import { UpdateProviderChainInput } from './dto/update-provider-chain.input';
import { ProviderChainResponseDto } from './dto/provider-chain-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from 'src/common/constants/jwtInterface';
import { SnakeCaseInterceptor } from 'src/common/interceptors/snake-case.interceptor';
import { resolveOrgId } from 'src/common/utils/org-resolver.helper';

@ApiTags('Provider Chains')
@ApiBearerAuth()
@ApiExtraModels(ProviderChainResponseDto)
@Controller('provider-chains')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(SnakeCaseInterceptor)
@Roles(UserRoles.ORG_ADMIN)
export class ProviderChainsController {
  constructor(private readonly providerChainsService: ProviderChainsService) {}

  @Get()
  @ApiOperation({ summary: 'List provider chains' })
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
    description: 'Paginated list of provider chains',
    type: PaginatedResponse,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(
    @Query() query: PaginationQueryDto,
    @Query('organization_id') queryOrgId: number,
    @Query('application_id') applicationId: number,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ): Promise<PaginatedResponse<ProviderChainResponseDto>> {
    const targetOrgId = resolveOrgId(user, queryOrgId);
    const filters = {
      applicationId: applicationId ? Number(applicationId) : undefined,
    };
    const { items, meta } = await this.providerChainsService.getAllProviderChainsAsDto(
      query,
      targetOrgId,
      filters,
    );
    const { protocol, host } = LinkBuilder.extractBaseUrl(req);
    const links = LinkBuilder.buildCollectionLinks(protocol, host, req.path, meta);

    return new PaginatedResponse(items, links, meta);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new provider chain' })
  @ApiResponse({
    status: 201,
    description: 'Provider chain created successfully',
    type: ProviderChainResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @Body() createProviderChainInput: CreateProviderChainInput,
    @Body('organizationId') orgId: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<ProviderChainResponseDto> {
    const targetOrgId = resolveOrgId(user, orgId);

    return this.providerChainsService.createProviderChainAsDto(
      createProviderChainInput,
      targetOrgId,
    );
  }

  @Put()
  @ApiOperation({ summary: 'Update a provider chain' })
  @ApiResponse({
    status: 200,
    description: 'Provider chain updated successfully',
    type: ProviderChainResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async update(
    @Body() updateProviderChainInput: UpdateProviderChainInput,
    @Body('organizationId') orgId: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<ProviderChainResponseDto> {
    const targetOrgId = resolveOrgId(user, orgId);

    return this.providerChainsService.updateProviderChainAsDto(
      updateProviderChainInput,
      targetOrgId,
    );
  }

  @Delete()
  @ApiOperation({ summary: 'Delete a provider chain' })
  @ApiResponse({ status: 200, description: 'Provider chain deleted successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async remove(
    @Body('chainId') chainId: number,
    @Body('organizationId') orgId: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<boolean> {
    const targetOrgId = resolveOrgId(user, orgId);

    return this.providerChainsService.softDeleteProviderChainByOrg(chainId, targetOrgId);
  }
}
