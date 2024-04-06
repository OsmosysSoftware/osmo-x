import { CreateServerapikeyInput } from './create-serverapikey.input';
import { InputType, Field, Int, PartialType } from '@nestjs/graphql';

@InputType()
export class UpdateServerapikeyInput extends PartialType(CreateServerapikeyInput) {
  @Field(() => Int)
  id: number;
}
