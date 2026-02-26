import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { WebhookService } from './webhook.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/role.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRoles } from 'src/common/constants/database';
import { CreateWebhookInput } from './dto/create-webhook.input';
import { Webhook } from './entities/webhook.entity';

@ApiTags('Webhooks')
@ApiBearerAuth()
@Controller('api/v1/webhooks')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRoles.ORG_ADMIN)
export class WebhookV1Controller {
  constructor(private readonly webhookService: WebhookService) {}

  @Get()
  @ApiOperation({ summary: 'List webhooks for a provider' })
  @ApiResponse({ status: 200, description: 'List of webhooks' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(@Query('providerId') providerId: number): Promise<Webhook[]> {
    return this.webhookService.findByProviderId(providerId);
  }

  @Post()
  @ApiOperation({ summary: 'Register a new webhook' })
  @ApiResponse({ status: 201, description: 'Webhook registered successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(@Body() createWebhookInput: CreateWebhookInput): Promise<Webhook> {
    return this.webhookService.registerWebhook(createWebhookInput);
  }
}
