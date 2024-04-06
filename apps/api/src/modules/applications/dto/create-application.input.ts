import { InputType, Int, Field } from '@nestjs/graphql';

@InputType()
export class CreateApplicationInput {
  @Field(() => Int, { description: 'Example field (placeholder)' })
  exampleField: number;
}
