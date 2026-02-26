import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiExtraModels, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DashboardStatsResponseDto } from './dto/dashboard-stats-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from 'src/common/constants/jwtInterface';

@ApiTags('Dashboard')
@ApiBearerAuth()
@ApiExtraModels(DashboardStatsResponseDto)
@Controller('api/v1/dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get aggregated notification statistics' })
  @ApiResponse({
    status: 200,
    description: 'Dashboard statistics',
    type: DashboardStatsResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getStats(@CurrentUser() user: JwtPayload): Promise<DashboardStatsResponseDto> {
    return this.dashboardService.getStats(user.organizationId);
  }
}
