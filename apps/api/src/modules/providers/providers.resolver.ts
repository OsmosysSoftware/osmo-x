import { Args, Mutation, Resolver, Query } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { QueryOptionsDto } from 'src/common/graphql/dtos/query-options.dto';
import { Provider } from './entities/provider.entity';
import { ProvidersService } from './providers.service';
import { CreateProviderInput } from './dto/create-provider.input';
import { ProviderResponse } from './dto/provider-response.dto';
import { GqlAuthGuard } from 'src/common/guards/api-key/gql-auth.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRoles } from 'src/common/constants/database';
import { RolesGuard } from 'src/common/guards/role.guard';

@Resolver(() => Provider)
@Roles(UserRoles.ADMIN)
@UseGuards(GqlAuthGuard, RolesGuard)
export class ProvidersResolver {
  constructor(private readonly providerService: ProvidersService) {}

  @Mutation(() => Provider, { name: 'provider' })
  async createProvider(
    @Args('createProviderInput') createProviderInput: CreateProviderInput,
  ): Promise<Provider> {
    return await this.providerService.createProvider(createProviderInput);
  }

  @Query(() => ProviderResponse, { name: 'providers' })
  async findAll(
    @Args('options', { type: () => QueryOptionsDto, nullable: true, defaultValue: {} })
    options: QueryOptionsDto,
  ): Promise<ProviderResponse> {
    return this.providerService.getAllProviders(options);
  }
}
