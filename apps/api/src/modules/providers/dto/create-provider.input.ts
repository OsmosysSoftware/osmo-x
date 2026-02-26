import { InputType, Field } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsObject, IsString } from 'class-validator';
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

  @ApiProperty({ description: 'ID of the user creating this provider', example: 1 })
  @Field()
  @IsInt()
  @IsNotEmpty()
  userId: number;
}
