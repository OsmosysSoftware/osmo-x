import { Controller, Get, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DashboardStatsResponseDto } from './dto/dashboard-stats-response.dto';
import { DashboardAnalyticsResponseDto } from './dto/dashboard-analytics-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from 'src/common/constants/jwtInterface';
import { SnakeCaseInterceptor } from 'src/common/interceptors/snake-case.interceptor';
import { resolveOrgId } from 'src/common/utils/org-resolver.helper';

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
  @ApiResponse({
    status: 200,
    description: 'Dashboard statistics',
    type: DashboardStatsResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getStats(
    @Query('organization_id') queryOrgId: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<DashboardStatsResponseDto> {
    const targetOrgId = resolveOrgId(user, queryOrgId);

    return this.dashboardService.getStats(targetOrgId);
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
    enum: ['7d', '30d', '90d', 'all'],
    description: 'Time period filter (default: 30d)',
  })
  @ApiQuery({
    name: 'application_id',
    required: false,
    type: Number,
    description: 'Filter by specific application',
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
    @CurrentUser() user: JwtPayload,
  ): Promise<DashboardAnalyticsResponseDto> {
    const targetOrgId = resolveOrgId(user, queryOrgId);

    return this.dashboardService.getAnalytics(targetOrgId, period || '30d', applicationId);
  }
}
