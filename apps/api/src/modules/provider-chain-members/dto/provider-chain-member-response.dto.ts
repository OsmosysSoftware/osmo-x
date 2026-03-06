import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProviderChainMemberResponseDto {
  @ApiProperty({ description: 'Chain member ID', example: 1 })
  id: number;

  @ApiProperty({ description: 'Parent chain ID', example: 1 })
  chainId: number;

  @ApiProperty({ description: 'Provider ID', example: 1 })
  providerId: number;

  @ApiProperty({
    description: 'Priority order in the fallback chain (lower = higher priority)',
    example: 1,
  })
  priorityOrder: number;

  @ApiProperty({ description: 'Whether member is active (0=inactive, 1=active)', example: 1 })
  isActive: number;

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
