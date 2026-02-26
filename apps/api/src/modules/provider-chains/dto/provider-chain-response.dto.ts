import { ObjectType, Field, Int } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
import { ProviderChain } from '../entities/provider-chain.entity';

@ObjectType()
export class ProviderChainResponse {
  @ApiProperty({ description: 'List of provider chains', type: () => [ProviderChain] })
  @Field(() => [ProviderChain])
  providerChains: ProviderChain[];

  @ApiProperty({ description: 'Total number of provider chains', example: 5 })
  @Field(() => Int)
  total: number;

  @ApiProperty({ description: 'Offset for pagination', example: 0 })
  @Field(() => Int)
  offset: number;

  @ApiProperty({ description: 'Maximum number of results returned', example: 20 })
  @Field(() => Int)
  limit: number;

  constructor(items: ProviderChain[], total: number, offset?: number, limit?: number) {
    this.providerChains = items;
    this.total = total;
    this.offset = offset ?? 0;
    this.limit = limit ?? items.length;
  }
}
