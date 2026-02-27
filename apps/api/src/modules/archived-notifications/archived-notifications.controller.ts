import {
  Controller,
  Delete,
  Get,
  HttpException,
  Logger,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ArchivedNotificationsService } from './archived-notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/role.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRoles } from 'src/common/constants/database';
import { Request } from 'express';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { PaginatedResponse } from 'src/common/dto/paginated-response.dto';
import { LinkBuilder } from 'src/common/utils/link-builder.helper';
import { ArchivedNotificationResponseDto } from './dto/archived-notification-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from 'src/common/constants/jwtInterface';
import { SnakeCaseInterceptor } from 'src/common/interceptors/snake-case.interceptor';
import { resolveOrgId } from 'src/common/utils/org-resolver.helper';

@ApiTags('Archived Notifications')
@ApiBearerAuth()
@ApiExtraModels(ArchivedNotificationResponseDto)
@Controller('api/v1/archived-notifications')
@UseInterceptors(SnakeCaseInterceptor)
export class ArchivedNotificationsController {
  private logger: Logger = new Logger(ArchivedNotificationsController.name);

  constructor(private readonly archivedNotificationsService: ArchivedNotificationsService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'List archived notifications' })
  @ApiQuery({
    name: 'organization_id',
    required: false,
    type: Number,
    description: 'Target org (SUPER_ADMIN only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of archived notifications',
    type: PaginatedResponse,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(
    @Query() query: PaginationQueryDto,
    @Query('organization_id') queryOrgId: number,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ): Promise<PaginatedResponse<ArchivedNotificationResponseDto>> {
    const targetOrgId = resolveOrgId(user, queryOrgId);
    const { items, meta } =
      await this.archivedNotificationsService.getAllArchivedNotificationsAsDto(query, targetOrgId);
    const { protocol, host } = LinkBuilder.extractBaseUrl(req);
    const links = LinkBuilder.buildCollectionLinks(protocol, host, req.path, meta);

    return new PaginatedResponse(items, links, meta);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoles.ORG_ADMIN)
  @ApiOperation({ summary: 'Get archived notification by ID' })
  @ApiQuery({
    name: 'organization_id',
    required: false,
    type: Number,
    description: 'Target org (SUPER_ADMIN only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Archived notification details',
    type: ArchivedNotificationResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Archived notification not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findOne(
    @Param('id') id: number,
    @Query('organization_id') queryOrgId: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<ArchivedNotificationResponseDto> {
    const targetOrgId = resolveOrgId(user, queryOrgId);

    return this.archivedNotificationsService.findByIdAsDto(id, targetOrgId);
  }

  @Post('archive')
  @ApiOperation({ summary: 'Archive completed notifications (scheduler endpoint)' })
  @ApiResponse({ status: 201, description: 'Completed notifications archived' })
  async archiveCompletedNotifications(): Promise<void> {
    try {
      await this.archivedNotificationsService.archiveCompletedNotificationsCron();
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error('Archive completed notifications failed', error);
    }
  }

  @Delete('delete')
  @ApiOperation({ summary: 'Delete old archived notifications (scheduler endpoint)' })
  @ApiResponse({ status: 200, description: 'Old archived notifications deleted' })
  async deleteArchivedNotifications(): Promise<void> {
    try {
      await this.archivedNotificationsService.deleteArchivedNotificationsCron();
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error('Delete archived notifications failed', error);
    }
  }
}
