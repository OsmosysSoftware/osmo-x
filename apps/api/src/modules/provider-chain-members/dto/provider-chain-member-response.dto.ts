import { ObjectType, Field, Int } from '@nestjs/graphql';
import { ProviderChainMember } from '../entities/provider-chain-member.entity';

@ObjectType()
export class ProviderChainMemberResponse {
  @Field(() => [ProviderChainMember])
  providerChainMembers: ProviderChainMember[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  offset: number;

  @Field(() => Int)
  limit: number;

  constructor(items: ProviderChainMember[], total: number, offset?: number, limit?: number) {
    this.providerChainMembers = items;
    this.total = total;
    this.offset = offset ?? 0;
    this.limit = limit ?? items.length;
  }
}
