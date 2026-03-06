import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProviderChainResponseDto {
  @ApiProperty({ description: 'Provider chain ID', example: 1 })
  chainId: number;

  @ApiProperty({ description: 'Chain name', example: 'Email Fallback Chain' })
  chainName: string;

  @ApiProperty({ description: 'Associated application ID', example: 1 })
  applicationId: number;

  @ApiProperty({ description: 'Provider type identifier', example: 1 })
  providerType: number;

  @ApiPropertyOptional({ description: 'Chain description', example: 'Primary email with fallback' })
  description?: string;

  @ApiProperty({ description: 'Whether this is the default chain (0=no, 1=yes)', example: 0 })
  isDefault: number;

  @ApiProperty({ description: 'Status: 1=Active, 0=Inactive', example: 1 })
  status: number;

  @ApiPropertyOptional({ description: 'ID of user who created this record', example: 1 })
  createdBy: number | null;

  @ApiPropertyOptional({ description: 'ID of user who last updated this record', example: 1 })
  updatedBy: number | null;

  @ApiProperty({ description: 'Creation timestamp', format: 'date-time' })
  createdOn: Date;

  @ApiProperty({ description: 'Last update timestamp', format: 'date-time' })
  updatedOn: Date;
}
