import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpException,
  InternalServerErrorException,
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
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/role.guard';
import { Request } from 'express';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { PaginatedResponse } from 'src/common/dto/paginated-response.dto';
import { LinkBuilder } from 'src/common/utils/link-builder.helper';
import { NotificationResponseDto } from './dto/notification-response.dto';
import { QueueService } from './queues/queue.service';
import { JsendFormatter } from 'src/common/jsend-formatter';
import { ApiKeyGuard } from 'src/common/guards/api-key/api-key.guard';
import { CreateNotificationDto } from './dtos/create-notification.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRoles } from 'src/common/constants/database';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from 'src/common/constants/jwtInterface';
import { SnakeCaseInterceptor } from 'src/common/interceptors/snake-case.interceptor';

@ApiTags('Notifications')
@ApiBearerAuth()
@ApiExtraModels(NotificationResponseDto)
@Controller('api/v1/notifications')
@UseInterceptors(SnakeCaseInterceptor)
export class NotificationsController {
  private logger: Logger = new Logger(NotificationsController.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly queueService: QueueService,
    private readonly jsend: JsendFormatter,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'List notifications' })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of notifications',
    type: PaginatedResponse,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(
    @Query() query: PaginationQueryDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ): Promise<PaginatedResponse<NotificationResponseDto>> {
    const { items, meta } = await this.notificationsService.getAllNotificationsAsDto(
      query,
      user.organizationId,
    );
    const { protocol, host } = LinkBuilder.extractBaseUrl(req);
    const links = LinkBuilder.buildCollectionLinks(protocol, host, req.path, meta);

    return new PaginatedResponse(items, links, meta);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoles.ORG_ADMIN)
  @ApiOperation({ summary: 'Get notification by ID' })
  @ApiResponse({ status: 200, description: 'Notification details', type: NotificationResponseDto })
  @ApiResponse({ status: 400, description: 'Notification not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findOne(
    @Param('id') id: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<NotificationResponseDto> {
    return this.notificationsService.findByIdAsDto(id, user.organizationId);
  }

  @Post('queue')
  @ApiOperation({ summary: 'Add pending notifications to queue' })
  @ApiResponse({ status: 201, description: 'Notifications queued successfully' })
  async addNotificationsToQueue(): Promise<void> {
    return this.notificationsService.addNotificationsToQueue();
  }

  @Post('confirm')
  @ApiOperation({ summary: 'Get provider confirmation for notifications' })
  @ApiResponse({ status: 201, description: 'Provider confirmation processed' })
  async getProviderConfirmation(): Promise<void> {
    return this.notificationsService.getProviderConfirmation();
  }

  @Post('redis/cleanup')
  @UseGuards(RolesGuard)
  @Roles(UserRoles.ORG_ADMIN)
  @ApiOperation({ summary: 'Cleanup completed and failed Redis jobs' })
  @ApiQuery({ name: 'gracePeriod', required: false, type: String })
  @ApiResponse({ status: 201, description: 'Redis cleanup completed' })
  async cleanupRedisJobs(@Query('gracePeriod') gracePeriod?: string): Promise<object> {
    try {
      const gracePeriodMs = gracePeriod ? parseInt(gracePeriod, 10) : 0;

      if (isNaN(gracePeriodMs) || gracePeriodMs < 0) {
        throw new BadRequestException('Invalid grace period value');
      }

      const result = await this.queueService.cleanupCompletedAndFailedJobs(gracePeriodMs);

      return this.jsend.success(result);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error('Redis cleanup failed', error);

      throw new InternalServerErrorException('Redis cleanup failed');
    }
  }

  @Post()
  @UseGuards(ApiKeyGuard)
  @ApiOperation({ summary: 'Create a new notification' })
  @ApiResponse({ status: 201, description: 'Notification created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createNotification(@Body() notificationData: CreateNotificationDto): Promise<object> {
    try {
      const notification = await this.notificationsService.createNotification(notificationData);

      return this.jsend.success(notification);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error('Create notification failed', error);

      throw new InternalServerErrorException('Create notification failed');
    }
  }
}
