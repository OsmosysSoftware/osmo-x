import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Application } from '../entities/application.entity';

@ObjectType()
export class ApplicationResponse {
  @Field(() => [Application])
  applications: Application[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  offset: number;

  @Field(() => Int)
  limit: number;

  constructor(items: Application[], total: number, offset?: number, limit?: number) {
    this.applications = items;
    this.total = total;
    this.offset = offset ?? 0;
    this.limit = limit ?? items.length;
  }
}
