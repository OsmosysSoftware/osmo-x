import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Provider } from '../entities/provider.entity';

@ObjectType()
export class ProviderResponse {
  @Field(() => [Provider])
  providers: Provider[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  offset: number;

  @Field(() => Int)
  limit: number;

  constructor(items: Provider[], total: number, offset?: number, limit?: number) {
    this.providers = items;
    this.total = total;
    this.offset = offset ?? 0;
    this.limit = limit ?? items.length;
  }
}
