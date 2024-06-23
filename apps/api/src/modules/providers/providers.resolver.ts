import { Args, Context, Mutation, Resolver, Query } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/common/guards/api-key/auth.guard';
import { QueryOptionsDto } from 'src/common/graphql/dtos/query-options.dto';
import { Provider } from './entities/provider.entity';
import { ProvidersService } from './providers.service';
import { CreateProviderInput } from './dto/create-provider.input';
import { ProviderResponse } from './dto/provider-response.dto';

@Resolver(() => Provider)
@UseGuards(AuthGuard)
export class ProvidersResolver {
  constructor(private readonly providerService: ProvidersService) {}

  @Mutation(() => Provider, { name: 'provider' })
  async createProvider(
    @Context() context,
    @Args('createProviderInput') createProviderInput: CreateProviderInput,
  ): Promise<Provider> {
    const request: Request = context.req;
    const authorizationHeader = request.headers['authorization'];
    return await this.providerService.createProvider(createProviderInput, authorizationHeader);
  }

  @Query(() => ProviderResponse, { name: 'provider' })
  async findAll(
    @Context() context,
    @Args('options', { type: () => QueryOptionsDto, nullable: true, defaultValue: {} })
    options: QueryOptionsDto,
  ): Promise<ProviderResponse> {
    const request: Request = context.req;
    const authorizationHeader = request.headers['authorization'];
    return this.providerService.getAllProviders(options, authorizationHeader);
  }
}
