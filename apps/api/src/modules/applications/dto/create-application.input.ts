import { InputType, Field } from '@nestjs/graphql';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsObject, IsOptional } from 'class-validator';
import { GraphQLJSONObject } from 'graphql-type-json';
import { IsEnabledStatus } from 'src/common/constants/database';
import { IsValidWhitelist } from 'src/common/decorators/is-valid-whitelist.decorator';

@InputType()
export class CreateApplicationInput {
  @ApiProperty({ description: 'Name of the application', example: 'My Notification App' })
  @Field()
  @IsNotEmpty()
  name: string;

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
