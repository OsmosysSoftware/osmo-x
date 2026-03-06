import { InputType, Field } from '@nestjs/graphql';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';
import { GraphQLJSONObject } from 'graphql-type-json';

@InputType()
export class UpdateProviderInput {
  @ApiProperty({ description: 'ID of the provider to update', example: 1 })
  @Field()
  @IsInt()
  @IsNotEmpty()
  providerId: number;

  @ApiPropertyOptional({
    description: 'Display name for the provider',
    example: 'Updated SMTP Provider',
  })
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Provider-specific configuration object',
    example: { host: 'smtp.example.com', port: 587 },
  })
  @Field(() => GraphQLJSONObject, { nullable: true })
  @IsOptional()
  @IsObject()
  configuration?: string;

  @ApiPropertyOptional({
    description: 'Whether this provider is enabled (0=Disabled, 1=Enabled)',
    example: 1,
  })
  @Field({ nullable: true })
  @IsOptional()
  @IsInt()
  isEnabled?: number;
}
