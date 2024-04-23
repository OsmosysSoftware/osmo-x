import { InputType, Int, Field } from '@nestjs/graphql';

@InputType()
export class CreateProviderInput {
  @Field(() => Int, { description: 'Example field (placeholder)' })
  exampleField: number;
}
