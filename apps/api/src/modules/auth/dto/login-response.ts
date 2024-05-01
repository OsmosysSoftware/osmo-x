import { Field, ObjectType } from '@nestjs/graphql';
import { ServerApiKey } from 'src/modules/server-api-keys/entities/server-api-key.entity';

@ObjectType()
export class LoginResponse {
  @Field()
  token: string;

  @Field()
  user: string;

  @Field(() => [ServerApiKey], { nullable: true })
  allKeys?: ServerApiKey[];
}
