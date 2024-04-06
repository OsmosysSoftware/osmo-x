import { CreateMasterProviderInput } from './create-master_provider.input';
import { InputType, Field, Int, PartialType } from '@nestjs/graphql';

@InputType()
export class UpdateMasterProviderInput extends PartialType(CreateMasterProviderInput) {
  @Field(() => Int)
  id: number;
}
