import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OrganizationResponseDto {
  @ApiProperty({ description: 'Organization ID', example: 1 })
  organizationId: number;

  @ApiProperty({ description: 'Organization name', example: 'Acme Corp' })
  name: string;

  @ApiProperty({ description: 'URL-friendly slug', example: 'acme-corp' })
  slug: string;

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
