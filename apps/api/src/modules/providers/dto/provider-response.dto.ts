import { ObjectType, Field, Int } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
import { Provider } from '../entities/provider.entity';

@ObjectType()
export class ProviderResponse {
  @ApiProperty({ description: 'List of providers', type: () => [Provider] })
  @Field(() => [Provider])
  providers: Provider[];

  @ApiProperty({ description: 'Total number of providers', example: 10 })
  @Field(() => Int)
  total: number;

  @ApiProperty({ description: 'Offset for pagination', example: 0 })
  @Field(() => Int)
  offset: number;

  @ApiProperty({ description: 'Maximum number of results returned', example: 20 })
  @Field(() => Int)
  limit: number;

  constructor(items: Provider[], total: number, offset?: number, limit?: number) {
    this.providers = items;
    this.total = total;
    this.offset = offset ?? 0;
    this.limit = limit ?? items.length;
  }
}
