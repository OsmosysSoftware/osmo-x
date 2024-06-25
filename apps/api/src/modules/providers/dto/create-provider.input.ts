import { InputType, Field } from '@nestjs/graphql';
import { IsInt, IsNotEmpty, IsObject, IsString } from 'class-validator';
import { GraphQLJSONObject } from 'graphql-type-json';

@InputType()
export class CreateProviderInput {
  @Field()
  @IsInt()
  @IsNotEmpty()
  applicationId: number;

  @Field()
  @IsInt()
  @IsNotEmpty()
  channelType: number;

  @Field(() => GraphQLJSONObject)
  @IsObject()
  configuration: string;

  @Field()
  @IsInt()
  isEnabled: number;

  @Field()
  @IsString()
  @IsNotEmpty()
  name: string;

  @Field()
  @IsInt()
  @IsNotEmpty()
  userId: number;
}
