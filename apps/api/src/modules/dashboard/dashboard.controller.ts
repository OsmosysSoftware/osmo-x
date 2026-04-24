import { Controller, Get, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { DashboardService, DashboardSource } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DashboardStatsResponseDto } from './dto/dashboard-stats-response.dto';
import { DashboardAnalyticsResponseDto } from './dto/dashboard-analytics-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from 'src/common/constants/jwtInterface';
import { SnakeCaseInterceptor } from 'src/common/interceptors/snake-case.interceptor';
import { resolveOrgId } from 'src/common/utils/org-resolver.helper';

const VALID_SOURCES: DashboardSource[] = ['active', 'archived', 'both'];

@ApiTags('Dashboard')
@ApiBearerAuth()
@ApiExtraModels(DashboardStatsResponseDto, DashboardAnalyticsResponseDto)
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
@UseInterceptors(SnakeCaseInterceptor)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get aggregated notification statistics' })
  @ApiQuery({
    name: 'organization_id',
    required: false,
    type: Number,
    description: 'Target org (SUPER_ADMIN only)',
  })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ['1h', '6h', '24h', '7d', '30d', 'all'],
    description: 'Time period filter (default: all)',
  })
  @ApiQuery({
    name: 'source',
    required: false,
    enum: ['active', 'archived', 'both'],
    description: 'Data source: active notifications, archived, or both (default: both)',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard statistics',
    type: DashboardStatsResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getStats(
    @Query('organization_id') queryOrgId: number,
    @Query('period') period: string,
    @Query('source') source: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<DashboardStatsResponseDto> {
    const targetOrgId = resolveOrgId(user, queryOrgId);
    const validSource = VALID_SOURCES.includes(source as DashboardSource)
      ? (source as DashboardSource)
      : 'both';

    return this.dashboardService.getStats(targetOrgId, validSource, period || 'all');
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get detailed analytics with trends and breakdowns' })
  @ApiQuery({
    name: 'organization_id',
    required: false,
    type: Number,
    description: 'Target org (SUPER_ADMIN only)',
  })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ['1h', '6h', '24h', '7d', '30d', 'all'],
    description: 'Time period filter (default: 24h)',
  })
  @ApiQuery({
    name: 'application_id',
    required: false,
    type: Number,
    description: 'Filter by specific application',
  })
  @ApiQuery({
    name: 'source',
    required: false,
    enum: ['active', 'archived', 'both'],
    description: 'Data source: active notifications, archived, or both (default: both)',
  })
  @ApiQuery({
    name: 'timezone',
    required: false,
    type: String,
    description:
      'IANA timezone name for grouping (e.g. Asia/Kolkata, Australia/Sydney). Defaults to UTC.',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard analytics',
    type: DashboardAnalyticsResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAnalytics(
    @Query('organization_id') queryOrgId: number,
    @Query('period') period: string,
    @Query('application_id') applicationId: number,
    @Query('source') source: string,
    @Query('timezone') timezone: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<DashboardAnalyticsResponseDto> {
    const targetOrgId = resolveOrgId(user, queryOrgId);
    const validSource = VALID_SOURCES.includes(source as DashboardSource)
      ? (source as DashboardSource)
      : 'both';
    const validTimezone = this.isValidTimezone(timezone) ? timezone : 'UTC';

    return this.dashboardService.getAnalytics(
      targetOrgId,
      period || '24h',
      applicationId,
      validSource,
      validTimezone,
    );
  }

  private isValidTimezone(tz: string): boolean {
    if (!tz) {
      return false;
    }

    try {
      Intl.DateTimeFormat(undefined, { timeZone: tz });

      return true;
    } catch {
      return false;
    }
  }
}
