import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
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
import { Request } from 'express';
import { WebhookService } from './webhook.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/role.guard';
import { SchedulerAuthGuard } from 'src/common/guards/scheduler-auth.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRoles } from 'src/common/constants/database';
import { CreateWebhookInput } from './dto/create-webhook.input';
import { UpdateWebhookInput } from './dto/update-webhook.input';
import { WebhookResponseDto } from './dto/webhook-response.dto';
import { WebhookLogResponseDto } from './dto/webhook-log-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from 'src/common/constants/jwtInterface';
import { SnakeCaseInterceptor } from 'src/common/interceptors/snake-case.interceptor';
import { resolveOrgId } from 'src/common/utils/org-resolver.helper';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { PaginatedResponse } from 'src/common/dto/paginated-response.dto';
import { LinkBuilder } from 'src/common/utils/link-builder.helper';

@ApiTags('Webhooks')
@ApiBearerAuth()
@ApiExtraModels(WebhookResponseDto, WebhookLogResponseDto)
@Controller('webhooks')
@UseInterceptors(SnakeCaseInterceptor)
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoles.ORG_ADMIN)
  @ApiOperation({ summary: 'List all webhooks for the organization' })
  @ApiQuery({
    name: 'organization_id',
    required: false,
    type: Number,
    description: 'Target org (SUPER_ADMIN only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of webhooks',
    type: PaginatedResponse,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(
    @Query() query: PaginationQueryDto,
    @Query('organization_id') queryOrgId: number,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ): Promise<PaginatedResponse<WebhookResponseDto>> {
    const targetOrgId = resolveOrgId(user, queryOrgId);
    const { items, meta } = await this.webhookService.getAllWebhooksAsDto(query, targetOrgId);
    const { protocol, host } = LinkBuilder.extractBaseUrl(req);
    const links = LinkBuilder.buildCollectionLinks(protocol, host, req.path, meta);

    return new PaginatedResponse(items, links, meta);
  }

  @Get('logs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoles.ORG_ADMIN)
  @ApiOperation({ summary: 'List delivery attempt logs for a webhook' })
  @ApiQuery({ name: 'webhook_id', required: true, type: Number })
  @ApiQuery({
    name: 'organization_id',
    required: false,
    type: Number,
    description: 'Target org (SUPER_ADMIN only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of webhook delivery logs',
    type: PaginatedResponse,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Webhook not found' })
  async findLogs(
    @Query('webhook_id') webhookId: number,
    @Query() query: PaginationQueryDto,
    @Query('organization_id') queryOrgId: number,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ): Promise<PaginatedResponse<WebhookLogResponseDto>> {
    const targetOrgId = resolveOrgId(user, queryOrgId);
    const { items, meta } = await this.webhookService.getWebhookLogsAsDto(
      webhookId,
      query,
      targetOrgId,
    );
    const { protocol, host } = LinkBuilder.extractBaseUrl(req);
    const links = LinkBuilder.buildCollectionLinks(protocol, host, req.path, meta);

    return new PaginatedResponse(items, links, meta);
  }

  @Delete('logs/cleanup')
  @UseGuards(SchedulerAuthGuard)
  @ApiOperation({ summary: 'Delete webhook logs past the retention window (scheduler endpoint)' })
  @ApiResponse({ status: 200, description: 'Old webhook logs deleted' })
  @ApiResponse({ status: 401, description: 'Missing or invalid x-scheduler-key header' })
  async cleanupLogs(): Promise<void> {
    await this.webhookService.deleteOldWebhookLogsCron();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoles.ORG_ADMIN)
  @ApiOperation({ summary: 'Register a new webhook' })
  @ApiResponse({
    status: 201,
    description: 'Webhook registered successfully',
    type: WebhookResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @Body() createWebhookInput: CreateWebhookInput,
    @Body('organizationId') orgId: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<WebhookResponseDto> {
    const targetOrgId = resolveOrgId(user, orgId);

    return this.webhookService.registerWebhookAsDto(createWebhookInput, targetOrgId);
  }

  @Put()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoles.ORG_ADMIN)
  @ApiOperation({ summary: 'Update a webhook URL' })
  @ApiResponse({ status: 200, description: 'Webhook updated', type: WebhookResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async update(
    @Body() updateWebhookInput: UpdateWebhookInput,
    @Body('organizationId') orgId: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<WebhookResponseDto> {
    const targetOrgId = resolveOrgId(user, orgId);

    return this.webhookService.updateWebhookAsDto(updateWebhookInput, targetOrgId);
  }

  @Delete()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoles.ORG_ADMIN)
  @ApiOperation({ summary: 'Delete a webhook' })
  @ApiResponse({ status: 200, description: 'Webhook deleted' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async remove(
    @Body('id') id: number,
    @Body('organizationId') orgId: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<boolean> {
    const targetOrgId = resolveOrgId(user, orgId);

    return this.webhookService.softDeleteWebhookAsDto(id, targetOrgId);
  }
}
