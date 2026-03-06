import { ApiProperty } from '@nestjs/swagger';

export class TrendDataPointDto {
  @ApiProperty({ description: 'Date in YYYY-MM-DD format', example: '2026-03-01' })
  date: string;

  @ApiProperty({ description: 'Total notifications on this date', example: 150 })
  total: number;

  @ApiProperty({ description: 'Successful notifications', example: 120 })
  successful: number;

  @ApiProperty({ description: 'Failed notifications', example: 30 })
  failed: number;
}

export class ChannelBreakdownDto {
  @ApiProperty({ description: 'Channel type enum value', example: 1 })
  channelType: number;

  @ApiProperty({ description: 'Total notifications for this channel', example: 500 })
  total: number;

  @ApiProperty({ description: 'Successful notifications', example: 450 })
  successful: number;

  @ApiProperty({ description: 'Failed notifications', example: 50 })
  failed: number;
}

export class ApplicationStatsDto {
  @ApiProperty({ description: 'Application ID', example: 1 })
  applicationId: number;

  @ApiProperty({ description: 'Application name', example: 'My App' })
  applicationName: string;

  @ApiProperty({ description: 'Total notifications', example: 1000 })
  total: number;

  @ApiProperty({ description: 'Successful notifications', example: 900 })
  successful: number;

  @ApiProperty({ description: 'Failed notifications', example: 100 })
  failed: number;

  @ApiProperty({ description: 'Success rate percentage', example: 90.0 })
  successRate: number;
}

export class ProviderStatsDto {
  @ApiProperty({ description: 'Provider ID', example: 1 })
  providerId: number;

  @ApiProperty({ description: 'Provider name', example: 'SMTP Production' })
  providerName: string;

  @ApiProperty({ description: 'Channel type enum value', example: 1 })
  channelType: number;

  @ApiProperty({ description: 'Total notifications', example: 500 })
  total: number;

  @ApiProperty({ description: 'Successful notifications', example: 480 })
  successful: number;

  @ApiProperty({ description: 'Failed notifications', example: 20 })
  failed: number;

  @ApiProperty({ description: 'Average retry count', example: 0.5 })
  avgRetryCount: number;
}

export class DashboardAnalyticsResponseDto {
  @ApiProperty({
    description: 'Notification volume over time',
    type: [TrendDataPointDto],
  })
  trends: TrendDataPointDto[];

  @ApiProperty({
    description: 'Breakdown by channel type',
    type: [ChannelBreakdownDto],
  })
  channelBreakdown: ChannelBreakdownDto[];

  @ApiProperty({
    description: 'Per-application statistics',
    type: [ApplicationStatsDto],
  })
  applicationStats: ApplicationStatsDto[];

  @ApiProperty({
    description: 'Provider performance statistics',
    type: [ProviderStatsDto],
  })
  providerStats: ProviderStatsDto[];
}
