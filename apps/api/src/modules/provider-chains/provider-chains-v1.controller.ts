import { Body, Controller, Delete, Get, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ProviderChainsService } from './provider-chains.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/role.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRoles } from 'src/common/constants/database';
import { QueryOptionsDto } from 'src/common/graphql/dtos/query-options.dto';
import { CreateProviderChainInput } from './dto/create-provider-chain.input';
import { UpdateProviderChainInput } from './dto/update-provider-chain.input';
import { ProviderChainResponse } from './dto/provider-chain-response.dto';
import { ProviderChain } from './entities/provider-chain.entity';

@ApiTags('Provider Chains')
@ApiBearerAuth()
@Controller('api/v1/provider-chains')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRoles.ORG_ADMIN)
export class ProviderChainsV1Controller {
  constructor(private readonly providerChainsService: ProviderChainsService) {}

  @Get()
  @ApiOperation({ summary: 'List provider chains' })
  @ApiResponse({ status: 200, description: 'Paginated list of provider chains' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(@Query() options: QueryOptionsDto): Promise<ProviderChainResponse> {
    return this.providerChainsService.getAllProviderChains(options);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new provider chain' })
  @ApiResponse({ status: 201, description: 'Provider chain created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(@Body() createProviderChainInput: CreateProviderChainInput): Promise<ProviderChain> {
    return this.providerChainsService.createProviderChain(createProviderChainInput);
  }

  @Put()
  @ApiOperation({ summary: 'Update a provider chain' })
  @ApiResponse({ status: 200, description: 'Provider chain updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async update(@Body() updateProviderChainInput: UpdateProviderChainInput): Promise<ProviderChain> {
    return this.providerChainsService.updateProviderChain(updateProviderChainInput);
  }

  @Delete()
  @ApiOperation({ summary: 'Delete a provider chain' })
  @ApiResponse({ status: 200, description: 'Provider chain deleted successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async remove(@Body('chainId') chainId: number): Promise<boolean> {
    return this.providerChainsService.softDeleteProviderChain(chainId);
  }
}
