import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { IsEnabledStatus, ProviderType } from 'src/common/constants/database';

export class CreateProviderChainInput {
  @ApiProperty({ description: 'Name of the provider chain', example: 'Email Fallback Chain' })
  @IsString()
  @IsNotEmpty()
  chainName: string;

  @ApiProperty({ description: 'ID of the application this chain belongs to', example: 1 })
  @IsNumber()
  @IsNotEmpty()
  applicationId: number;

  @ApiProperty({
    description:
      'Provider type (0=Other, 1=Email, 2=SMS, 3=WhatsApp Business, 4=Push, 5=Voice, 6=WhatsApp Direct)',
    example: 1,
    enum: [0, 1, 2, 3, 4, 5, 6],
  })
  @IsNumber()
  @IsEnum(ProviderType)
  providerType: number;

  @ApiPropertyOptional({
    description: 'Optional description of the provider chain',
    example: 'Primary email chain with Mailgun fallback to SES',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Whether this chain is the default for its provider type (0=No, 1=Yes)',
    example: 1,
    enum: [0, 1],
  })
  @IsNumber()
  @IsOptional()
  @IsEnum(IsEnabledStatus)
  isDefault?: number;
}
