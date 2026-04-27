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
@Controller('archived-notifications')
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
  @ApiQuery({
    name: 'channel_type',
    required: false,
    type: Number,
    description: 'Filter by channel type',
  })
  @ApiQuery({
    name: 'delivery_status',
    required: false,
    type: Number,
    description: 'Filter by delivery status',
  })
  @ApiQuery({
    name: 'application_id',
    required: false,
    type: Number,
    description: 'Filter by application',
  })
  @ApiQuery({
    name: 'date_from',
    required: false,
    type: String,
    description: 'Filter by created_on >= datetime (ISO 8601)',
  })
  @ApiQuery({
    name: 'date_to',
    required: false,
    type: String,
    description: 'Filter by created_on <= datetime (ISO 8601)',
  })
  @ApiQuery({
    name: 'provider_id',
    required: false,
    type: Number,
    description: 'Filter by provider',
  })
  @ApiQuery({
    name: 'recipient',
    required: false,
    type: String,
    description: 'Match data.to/cc/bcc/target (string or array). Type ≥ 3 chars for fast results.',
  })
  @ApiQuery({
    name: 'sender',
    required: false,
    type: String,
    description: 'Match data.from. Type ≥ 3 chars for fast results.',
  })
  @ApiQuery({
    name: 'subject',
    required: false,
    type: String,
    description: 'Match data.subject. Type ≥ 3 chars for fast results.',
  })
  @ApiQuery({
    name: 'message_body',
    required: false,
    type: String,
    description:
      'Match data.text/html/message and nested template/push body fields. Type ≥ 3 chars for fast results.',
  })
  @ApiQuery({
    name: 'data_filter',
    required: false,
    style: 'deepObject',
    explode: true,
    schema: { type: 'object', additionalProperties: { type: 'string' } },
    description:
      'Top-level data JSON key/value pairs (data_filter[key]=value). Keys must match ' +
      '^[a-zA-Z0-9_]{1,64}$. Multiple pairs are AND-combined.',
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
    @Query('channel_type') channelType: number,
    @Query('delivery_status') deliveryStatus: number,
    @Query('application_id') applicationId: number,
    @Query('date_from') dateFrom: string,
    @Query('date_to') dateTo: string,
    @Query('provider_id') providerId: number,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ): Promise<PaginatedResponse<ArchivedNotificationResponseDto>> {
    const targetOrgId = resolveOrgId(user, queryOrgId);
    const filters = {
      channelType: channelType ? Number(channelType) : undefined,
      deliveryStatus: deliveryStatus ? Number(deliveryStatus) : undefined,
      applicationId: applicationId ? Number(applicationId) : undefined,
      dateFrom: dateFrom || undefined,
      providerId: providerId ? Number(providerId) : undefined,
      dateTo: dateTo || undefined,
      recipient: query.recipient,
      sender: query.sender,
      subject: query.subject,
      messageBody: query.messageBody,
      dataFilter: query.dataFilter,
    };
    const { items, meta } =
      await this.archivedNotificationsService.getAllArchivedNotificationsAsDto(
        query,
        targetOrgId,
        filters,
      );
    const { protocol, host } = LinkBuilder.extractBaseUrl(req);
    const links = LinkBuilder.buildCollectionLinks(protocol, host, req.path, meta);

    return new PaginatedResponse(items, links, meta);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoles.ORG_USER)
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
