import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { ServerapikeysService } from './serverapikeys.service';
import { Serverapikey } from './entities/serverapikey.entity';
import { CreateServerapikeyInput } from './dto/create-serverapikey.input';
import { UpdateServerapikeyInput } from './dto/update-serverapikey.input';

@Resolver(() => Serverapikey)
export class ServerapikeysResolver {
  constructor(private readonly serverapikeysService: ServerapikeysService) {}

  @Mutation(() => Serverapikey)
  createServerapikey(@Args('createServerapikeyInput') createServerapikeyInput: CreateServerapikeyInput) {
    return this.serverapikeysService.create(createServerapikeyInput);
  }

  @Query(() => [Serverapikey], { name: 'serverapikeys' })
  findAll() {
    return this.serverapikeysService.findAll();
  }

  @Query(() => Serverapikey, { name: 'serverapikey' })
  findOne(@Args('id', { type: () => Int }) id: number) {
    return this.serverapikeysService.findOne(id);
  }

  @Mutation(() => Serverapikey)
  updateServerapikey(@Args('updateServerapikeyInput') updateServerapikeyInput: UpdateServerapikeyInput) {
    return this.serverapikeysService.update(updateServerapikeyInput.id, updateServerapikeyInput);
  }

  @Mutation(() => Serverapikey)
  removeServerapikey(@Args('id', { type: () => Int }) id: number) {
    return this.serverapikeysService.remove(id);
  }
}
