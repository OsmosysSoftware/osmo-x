import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { IsEnabledStatus, ProviderType } from 'src/common/constants/database';

export class UpdateProviderChainInput {
  @ApiProperty({ description: 'ID of the provider chain to update', example: 1 })
  @IsNumber()
  chainId: number;

  @ApiPropertyOptional({
    description: 'Updated name of the provider chain',
    example: 'Updated Email Chain',
  })
  @IsString()
  @IsOptional()
  chainName?: string;

  @ApiPropertyOptional({ description: 'Updated application ID', example: 2 })
  @IsNumber()
  @IsOptional()
  applicationId?: number;

  @ApiPropertyOptional({
    description:
      'Updated provider type (0=Other, 1=Email, 2=SMS, 3=WhatsApp Business, 4=Push, 5=Voice, 6=WhatsApp Direct)',
    example: 1,
    enum: [0, 1, 2, 3, 4, 5, 6],
  })
  @IsNumber()
  @IsOptional()
  @IsEnum(ProviderType)
  providerType?: number;

  @ApiPropertyOptional({
    description: 'Updated description of the provider chain',
    example: 'Updated fallback chain description',
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
