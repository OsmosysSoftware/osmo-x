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
import { ApiBearerAuth, ApiExtraModels, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
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

@ApiTags('Provider Chains')
@ApiBearerAuth()
@ApiExtraModels(ProviderChainResponseDto)
@Controller('api/v1/provider-chains')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(SnakeCaseInterceptor)
@Roles(UserRoles.ORG_ADMIN)
export class ProviderChainsController {
  constructor(private readonly providerChainsService: ProviderChainsService) {}

  @Get()
  @ApiOperation({ summary: 'List provider chains' })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of provider chains',
    type: PaginatedResponse,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(
    @Query() query: PaginationQueryDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ): Promise<PaginatedResponse<ProviderChainResponseDto>> {
    const { items, meta } = await this.providerChainsService.getAllProviderChainsAsDto(
      query,
      user.organizationId,
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
    @CurrentUser() user: JwtPayload,
  ): Promise<ProviderChainResponseDto> {
    return this.providerChainsService.createProviderChainAsDto(
      createProviderChainInput,
      user.organizationId,
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
    @CurrentUser() user: JwtPayload,
  ): Promise<ProviderChainResponseDto> {
    return this.providerChainsService.updateProviderChainAsDto(
      updateProviderChainInput,
      user.organizationId,
    );
  }

  @Delete()
  @ApiOperation({ summary: 'Delete a provider chain' })
  @ApiResponse({ status: 200, description: 'Provider chain deleted successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async remove(
    @Body('chainId') chainId: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<boolean> {
    return this.providerChainsService.softDeleteProviderChainByOrg(chainId, user.organizationId);
  }
}
