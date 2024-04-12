import { CreateServerApiKeyInput } from './create-server-api-key.input';
import { InputType, Field, Int, PartialType } from '@nestjs/graphql';

@InputType()
export class UpdateServerApiKeyInput extends PartialType(CreateServerApiKeyInput) {
  @Field(() => Int)
  id: number;
}
