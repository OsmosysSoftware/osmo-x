import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ description: 'User ID', example: 1 })
  userId: number;

  @ApiProperty({ description: 'Unique login username', example: 'john.doe' })
  username: string;

  @ApiPropertyOptional({ description: 'User email address', example: 'john.doe@example.com' })
  email?: string;

  @ApiProperty({
    description: 'User role: 0=OrgUser, 1=OrgAdmin, 2=SuperAdmin',
    example: 0,
  })
  userRole: number;

  @ApiPropertyOptional({ description: 'Organization ID', example: 1 })
  organizationId?: number;

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
