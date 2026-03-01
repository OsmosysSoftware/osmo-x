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
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from 'src/common/constants/jwtInterface';
import { SnakeCaseInterceptor } from 'src/common/interceptors/snake-case.interceptor';
import { resolveOrgId } from 'src/common/utils/org-resolver.helper';

@ApiTags('Dashboard')
@ApiBearerAuth()
@ApiExtraModels(DashboardStatsResponseDto)
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
}
