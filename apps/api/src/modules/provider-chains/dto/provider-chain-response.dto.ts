import { ObjectType, Field, Int } from '@nestjs/graphql';
import { ProviderChain } from '../entities/provider-chain.entity';

@ObjectType()
export class ProviderChainResponse {
  @Field(() => [ProviderChain])
  providerChains: ProviderChain[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  offset: number;

  @Field(() => Int)
  limit: number;

  constructor(items: ProviderChain[], total: number, offset?: number, limit?: number) {
    this.providerChains = items;
    this.total = total;
    this.offset = offset ?? 0;
    this.limit = limit ?? items.length;
  }
}
