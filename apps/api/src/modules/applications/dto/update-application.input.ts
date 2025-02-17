import { Field, InputType } from '@nestjs/graphql';
import { IsString, IsOptional, IsNumber, IsObject, IsNotEmpty, IsEnum } from 'class-validator';
import { GraphQLJSONObject } from 'graphql-type-json';
import { IsEnabledStatus } from 'src/common/constants/database';

@InputType()
export class UpdateApplicationInput {
  @Field()
  @IsNumber()
  @IsNotEmpty()
  applicationId: number;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  name?: string | null;

  @Field({ nullable: true })
  @IsEnum(IsEnabledStatus)
  @IsOptional()
  testModeEnabled?: number | null;

  @Field(() => GraphQLJSONObject, { nullable: true })
  @IsObject()
  @IsOptional()
  whitelistRecipients?: string | null;
}
