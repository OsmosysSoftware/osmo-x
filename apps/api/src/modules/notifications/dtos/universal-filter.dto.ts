import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class UniversalFilter {
  @Field()
  field: string;

  @Field()
  operator: string;

  @Field()
  value: string;
}
