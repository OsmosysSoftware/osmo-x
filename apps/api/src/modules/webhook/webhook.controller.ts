import { Body, Controller, Get, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiExtraModels, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { WebhookService } from './webhook.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/role.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRoles } from 'src/common/constants/database';
import { CreateWebhookInput } from './dto/create-webhook.input';
import { WebhookResponseDto } from './dto/webhook-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from 'src/common/constants/jwtInterface';
import { SnakeCaseInterceptor } from 'src/common/interceptors/snake-case.interceptor';

@ApiTags('Webhooks')
@ApiBearerAuth()
@ApiExtraModels(WebhookResponseDto)
@Controller('api/v1/webhooks')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(SnakeCaseInterceptor)
@Roles(UserRoles.ORG_ADMIN)
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Get()
  @ApiOperation({ summary: 'List webhooks for a provider' })
  @ApiResponse({ status: 200, description: 'List of webhooks', type: [WebhookResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(
    @Query('providerId') providerId: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<WebhookResponseDto[]> {
    return this.webhookService.findByProviderIdAsDto(providerId, user.organizationId);
  }

  @Post()
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
    @CurrentUser() user: JwtPayload,
  ): Promise<WebhookResponseDto> {
    return this.webhookService.registerWebhookAsDto(createWebhookInput, user.organizationId);
  }
}
