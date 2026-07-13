import { Controller, Get, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from 'src/common/constants/jwtInterface';
import { SnakeCaseInterceptor } from 'src/common/interceptors/snake-case.interceptor';
import { ApplicationsService } from './applications.service';
import { ApplicationResponseDto } from './dto/application-response.dto';
import { resolveOrgId } from 'src/common/utils/org-resolver.helper';

@ApiTags('Applications')
@ApiBearerAuth()
@Controller('accessible-applications')
@UseGuards(JwtAuthGuard)
@UseInterceptors(SnakeCaseInterceptor)
export class AccessibleApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Get()
  @ApiOperation({
    summary: 'List applications accessible to the current user',
    description:
      'Returns all org applications for ORG_ADMIN+. ' +
      'For NOTIFICATION_VIEWER, returns only their permitted applications.',
  })
  @ApiResponse({ status: 200, type: [ApplicationResponseDto] })
  async getAccessible(
    @CurrentUser() user: JwtPayload,
    @Query('organization_id') queryOrgId?: number,
  ): Promise<ApplicationResponseDto[]> {
    const organizationId = resolveOrgId(user, queryOrgId);

    return this.applicationsService.getAccessibleApplicationsAsDto(
      user.userId,
      user.role,
      organizationId,
    );
  }
}
