import { InputType, Int, Field } from '@nestjs/graphql';

@InputType()
export class CreateServerapikeyInput {
  @Field(() => Int, { description: 'Example field (placeholder)' })
  exampleField: number;
}
