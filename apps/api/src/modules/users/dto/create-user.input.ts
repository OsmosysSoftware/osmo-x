import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class CreateUserInput {
  @Field(() => String, { description: 'Your username' })
  username: string;

  @Field(() => String, { description: 'Your password' })
  password: string;
}
