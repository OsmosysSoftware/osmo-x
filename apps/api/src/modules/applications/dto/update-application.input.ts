import { Field, InputType } from '@nestjs/graphql';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsObject, IsNotEmpty, IsEnum } from 'class-validator';
import { GraphQLJSONObject } from 'graphql-type-json';
import { IsEnabledStatus } from 'src/common/constants/database';
import { IsValidWhitelist } from 'src/common/decorators/is-valid-whitelist.decorator';

@InputType()
export class UpdateApplicationInput {
  @ApiProperty({ description: 'ID of the application to update', example: 1 })
  @Field()
  @IsNumber()
  @IsNotEmpty()
  applicationId: number;

  @ApiPropertyOptional({
    description: 'Updated name of the application',
    example: 'My Updated App',
  })
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  name?: string | null;

  @ApiPropertyOptional({
    description: 'Whether test mode is enabled for this application',
    example: 1,
    enum: [0, 1],
  })
  @Field({ nullable: true })
  @IsEnum(IsEnabledStatus)
  @IsOptional()
  testModeEnabled?: number | null;

  @ApiPropertyOptional({
    description: 'JSON object defining whitelisted recipients for test mode',
    example: { email: ['test@example.com'], sms: ['+1234567890'] },
  })
  @Field(() => GraphQLJSONObject, { nullable: true })
  @IsObject()
  @IsOptional()
  @IsValidWhitelist()
  whitelistRecipients?: string | null;
}
