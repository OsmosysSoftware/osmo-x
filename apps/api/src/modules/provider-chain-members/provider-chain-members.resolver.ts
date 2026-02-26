import { Args, Query, Resolver } from '@nestjs/graphql';
import { ProviderChainMember } from './entities/provider-chain-member.entity';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRoles } from 'src/common/constants/database';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from 'src/common/guards/gql-auth.guard';
import { RolesGuard } from 'src/common/guards/role.guard';
import { QueryOptionsDto } from 'src/common/graphql/dtos/query-options.dto';
import { ProviderChainMemberListResponse } from './dto/provider-chain-member-list.dto';
import { ProviderChainMembersService } from './provider-chain-members.service';

@Resolver(() => ProviderChainMember)
@Roles(UserRoles.ORG_ADMIN)
@UseGuards(GqlAuthGuard, RolesGuard)
export class ProviderChainMembersResolver {
  constructor(private readonly providerChainMembersService: ProviderChainMembersService) {}

  @Query(() => ProviderChainMemberListResponse, { name: 'providerChainMembers' })
  async findAll(
    @Args('options', { type: () => QueryOptionsDto, nullable: true, defaultValue: {} })
    options: QueryOptionsDto,
  ): Promise<ProviderChainMemberListResponse> {
    return this.providerChainMembersService.getAllProviderChainMembers(options);
  }
}
