import { InputType, Field } from '@nestjs/graphql';
import { IsEnum, IsNotEmpty, IsObject, IsOptional } from 'class-validator';
import { GraphQLJSONObject } from 'graphql-type-json';
import { IsEnabledStatus } from 'src/common/constants/database';
import { IsValidWhitelist } from 'src/common/decorators/is-valid-whitelist.decorator';

@InputType()
export class CreateApplicationInput {
  @Field()
  @IsNotEmpty()
  name: string;

  @Field({ nullable: true })
  @IsEnum(IsEnabledStatus)
  @IsOptional()
  testModeEnabled?: number | null;

  @Field(() => GraphQLJSONObject, { nullable: true })
  @IsObject()
  @IsOptional()
  @IsValidWhitelist()
  whitelistRecipients?: string | null;
}
