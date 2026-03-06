import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MasterProviderResponseDto {
  @ApiProperty({ description: 'Master provider ID', example: 1 })
  masterId: number;

  @ApiProperty({ description: 'Provider name', example: 'SMTP' })
  name: string;

  @ApiProperty({ description: 'Provider type identifier', example: 1 })
  providerType: number;

  @ApiProperty({
    description: 'JSON schema defining the provider configuration fields',
    example: { host: 'string', port: 'number', username: 'string', password: 'string' },
  })
  configuration: string;

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
