import { InputType, Int, Field } from '@nestjs/graphql';

@InputType()
export class CreateServerApiKeyInput {
  @Field(() => Int, { description: 'Example field (placeholder)' })
  exampleField: number;
}
