import { ObjectType, Field, Int } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
import { Application } from '../entities/application.entity';

@ObjectType()
export class ApplicationResponse {
  @ApiProperty({ description: 'List of applications', type: () => [Application] })
  @Field(() => [Application])
  applications: Application[];

  @ApiProperty({ description: 'Total number of applications', example: 50 })
  @Field(() => Int)
  total: number;

  @ApiProperty({ description: 'Offset for pagination', example: 0 })
  @Field(() => Int)
  offset: number;

  @ApiProperty({ description: 'Maximum number of results returned', example: 20 })
  @Field(() => Int)
  limit: number;

  constructor(items: Application[], total: number, offset?: number, limit?: number) {
    this.applications = items;
    this.total = total;
    this.offset = offset ?? 0;
    this.limit = limit ?? items.length;
  }
}
