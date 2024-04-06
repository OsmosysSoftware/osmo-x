import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { MasterProvidersService } from './master_providers.service';
import { MasterProvider } from './entities/master_provider.entity';
import { CreateMasterProviderInput } from './dto/create-master_provider.input';
import { UpdateMasterProviderInput } from './dto/update-master_provider.input';

@Resolver(() => MasterProvider)
export class MasterProvidersResolver {
  constructor(private readonly masterProvidersService: MasterProvidersService) {}

  @Mutation(() => MasterProvider)
  createMasterProvider(@Args('createMasterProviderInput') createMasterProviderInput: CreateMasterProviderInput) {
    return this.masterProvidersService.create(createMasterProviderInput);
  }

  @Query(() => [MasterProvider], { name: 'masterProviders' })
  findAll() {
    return this.masterProvidersService.findAll();
  }

  @Query(() => MasterProvider, { name: 'masterProvider' })
  findOne(@Args('id', { type: () => Int }) id: number) {
    return this.masterProvidersService.findOne(id);
  }

  @Mutation(() => MasterProvider)
  updateMasterProvider(@Args('updateMasterProviderInput') updateMasterProviderInput: UpdateMasterProviderInput) {
    return this.masterProvidersService.update(updateMasterProviderInput.id, updateMasterProviderInput);
  }

  @Mutation(() => MasterProvider)
  removeMasterProvider(@Args('id', { type: () => Int }) id: number) {
    return this.masterProvidersService.remove(id);
  }
}
