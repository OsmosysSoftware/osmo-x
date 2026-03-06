import { ApiProperty } from '@nestjs/swagger';

export class DashboardStatsResponseDto {
  @ApiProperty({ description: 'Total number of active applications', example: 5 })
  totalApplications: number;

  @ApiProperty({ description: 'Total number of active providers', example: 12 })
  totalProviders: number;

  @ApiProperty({ description: 'Total number of notifications', example: 1000 })
  totalNotifications: number;

  @ApiProperty({ description: 'Number of successfully delivered notifications', example: 850 })
  successfulNotifications: number;

  @ApiProperty({ description: 'Number of failed notifications', example: 50 })
  failedNotifications: number;

  @ApiProperty({ description: 'Number of pending notifications', example: 100 })
  pendingNotifications: number;

  @ApiProperty({
    description: 'Success rate as a percentage (0-100)',
    example: 85.0,
  })
  successRate: number;
}
