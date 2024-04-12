import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class Application {
  @Field(() => Int, { description: 'Example field (placeholder)' })
  exampleField: number;
}
