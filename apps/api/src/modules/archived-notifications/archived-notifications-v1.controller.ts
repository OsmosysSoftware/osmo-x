import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ArchivedNotificationsService } from './archived-notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/role.guard';
import { QueryOptionsDto } from 'src/common/graphql/dtos/query-options.dto';
import { ArchivedNotificationResponse } from './dtos/archived-notification-response.dto';

@ApiTags('Archived Notifications')
@ApiBearerAuth()
@Controller('api/v1/archived-notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ArchivedNotificationsV1Controller {
  constructor(private readonly archivedNotificationsService: ArchivedNotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'List archived notifications' })
  @ApiResponse({ status: 200, description: 'Paginated list of archived notifications' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(@Query() options: QueryOptionsDto): Promise<ArchivedNotificationResponse> {
    return this.archivedNotificationsService.getAllArchivedNotifications(options);
  }
}
