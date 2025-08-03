import { Args, Query, Resolver } from '@nestjs/graphql';
import { ProviderChain } from './entities/provider-chain.entity';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRoles } from 'src/common/constants/database';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from 'src/common/guards/gql-auth.guard';
import { RolesGuard } from 'src/common/guards/role.guard';
import { ProviderChainsService } from './provider-chains.service';
import { QueryOptionsDto } from 'src/common/graphql/dtos/query-options.dto';
import { ProviderChainResponse } from './dto/provider-chain-response.dto';

@Resolver(() => ProviderChain)
@Roles(UserRoles.ADMIN)
@UseGuards(GqlAuthGuard, RolesGuard)
export class ProviderChainsResolver {
  constructor(private readonly providerChainsService: ProviderChainsService) {}

  @Query(() => ProviderChainResponse, { name: 'providerChains' })
  async findAll(
    @Args('options', { type: () => QueryOptionsDto, nullable: true, defaultValue: {} })
    options: QueryOptionsDto,
  ): Promise<ProviderChainResponse> {
    return this.providerChainsService.getAllProviderChains(options);
  }
}
