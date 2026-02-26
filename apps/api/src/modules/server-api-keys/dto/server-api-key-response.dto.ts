import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ServerApiKeyResponseDto {
  @ApiProperty({ description: 'Server API key ID', example: 1 })
  apiKeyId: number;

  @ApiProperty({
    description: 'Masked display version of the API key',
    example: 'sk-****abcd',
  })
  maskedApiKey: string;

  @ApiProperty({ description: 'Associated application ID', example: 1 })
  applicationId: number;

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
