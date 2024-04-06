import { InputType, Int, Field } from '@nestjs/graphql';

@InputType()
export class CreateMasterProviderInput {
  @Field(() => Int, { description: 'Example field (placeholder)' })
  exampleField: number;
}
