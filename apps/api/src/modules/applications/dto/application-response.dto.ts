import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApplicationResponseDto {
  @ApiProperty({ description: 'Application ID', example: 1 })
  applicationId: number;

  @ApiProperty({ description: 'Application name', example: 'My Notification App' })
  name: string;

  @ApiProperty({ description: 'Owner user ID', example: 1 })
  userId: number;

  @ApiPropertyOptional({ description: 'Organization ID', example: 1 })
  organizationId: number;

  @ApiProperty({ description: 'Test mode enabled (0=disabled, 1=enabled)', example: 0 })
  testModeEnabled: number;

  @ApiPropertyOptional({ description: 'Whitelisted recipients for test mode' })
  whitelistRecipients: string;

  @ApiProperty({ description: 'Status (1=active, 0=inactive)', example: 1 })
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
