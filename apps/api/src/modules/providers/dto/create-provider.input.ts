import { InputType, Field } from '@nestjs/graphql';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
} from 'class-validator';
import { GraphQLJSONObject } from 'graphql-type-json';

@InputType()
export class CreateProviderInput {
  @ApiProperty({ description: 'ID of the application this provider belongs to', example: 1 })
  @Field()
  @IsInt()
  @IsNotEmpty()
  applicationId: number;

  @ApiProperty({
    description:
      'Channel type for the provider (1=Email, 2=SMS, 3=WhatsApp Business, 4=Push, 5=Voice, 6=WhatsApp Direct)',
    example: 1,
    enum: [0, 1, 2, 3, 4, 5, 6],
  })
  @Field()
  @IsInt()
  @IsNotEmpty()
  channelType: number;

  @ApiProperty({
    description: 'Provider-specific configuration object (e.g., API keys, credentials)',
    example: { host: 'smtp.example.com', port: 587, username: 'user', password: 'pass' },
  })
  @Field(() => GraphQLJSONObject)
  @IsObject()
  configuration: string;

  @ApiProperty({
    description: 'Whether this provider is enabled (0=Disabled, 1=Enabled)',
    example: 1,
    enum: [0, 1],
  })
  @Field()
  @IsInt()
  isEnabled: number;

  @ApiProperty({ description: 'Display name for the provider', example: 'SMTP Provider' })
  @Field()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description:
      'Max retry attempts for this provider. Omit or null to use global MAX_RETRY_COUNT env config',
    example: 3,
  })
  @Field({ nullable: true })
  @IsOptional()
  @ValidateIf((o) => o.maxRetryCount !== null)
  @IsInt()
  @Min(0)
  maxRetryCount?: number | null;

  @ApiProperty({
    description: 'ID of the user creating this provider (derived from JWT in REST endpoints)',
    example: 1,
    required: false,
  })
  @Field({ nullable: true })
  @IsOptional()
  @IsInt()
  userId?: number;
}
