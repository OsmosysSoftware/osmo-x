import { ObjectType, Field, Int } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
import { ProviderChainMember } from '../entities/provider-chain-member.entity';

@ObjectType()
export class ProviderChainMemberListResponse {
  @ApiProperty({ description: 'List of provider chain members', type: () => [ProviderChainMember] })
  @Field(() => [ProviderChainMember])
  providerChainMembers: ProviderChainMember[];

  @ApiProperty({ description: 'Total number of provider chain members', example: 3 })
  @Field(() => Int)
  total: number;

  @ApiProperty({ description: 'Offset for pagination', example: 0 })
  @Field(() => Int)
  offset: number;

  @ApiProperty({ description: 'Maximum number of results returned', example: 20 })
  @Field(() => Int)
  limit: number;

  constructor(items: ProviderChainMember[], total: number, offset?: number, limit?: number) {
    this.providerChainMembers = items;
    this.total = total;
    this.offset = offset ?? 0;
    this.limit = limit ?? items.length;
  }
}
