import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Query,
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
import { ServerApiKeysService } from './server-api-keys.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/role.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRoles } from 'src/common/constants/database';
import { ServerApiKeyResponseDto } from './dto/server-api-key-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from 'src/common/constants/jwtInterface';
import { SnakeCaseInterceptor } from 'src/common/interceptors/snake-case.interceptor';
import { resolveOrgId } from 'src/common/utils/org-resolver.helper';

@ApiTags('API Keys')
@ApiBearerAuth()
@ApiExtraModels(ServerApiKeyResponseDto)
@Controller('api/v1/api-keys')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(SnakeCaseInterceptor)
@Roles(UserRoles.ORG_ADMIN)
export class ServerApiKeysController {
  constructor(private readonly serverApiKeysService: ServerApiKeysService) {}

  @Get()
  @ApiOperation({ summary: 'List API keys for an application' })
  @ApiQuery({
    name: 'organization_id',
    required: false,
    type: Number,
    description: 'Target org (SUPER_ADMIN only)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of API keys for the specified application',
    type: [ServerApiKeyResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(
    @Query('applicationId') applicationId: number,
    @Query('organization_id') queryOrgId: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<ServerApiKeyResponseDto[]> {
    const targetOrgId = resolveOrgId(user, queryOrgId);

    return this.serverApiKeysService.findByRelatedApplicationIdAsDto(applicationId, targetOrgId);
  }

  @Post()
  @ApiOperation({ summary: 'Generate a new API key for an application' })
  @ApiResponse({ status: 201, description: 'API key generated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async generate(
    @Body('applicationId') applicationId: number,
    @Body('organizationId') orgId: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<string> {
    const targetOrgId = resolveOrgId(user, orgId);

    return this.serverApiKeysService.generateApiKeyByOrg(applicationId, targetOrgId);
  }

  @Delete()
  @ApiOperation({ summary: 'Revoke an API key' })
  @ApiResponse({ status: 200, description: 'API key revoked' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async revoke(
    @Body('apiKeyId') apiKeyId: number,
    @Body('organizationId') orgId: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<boolean> {
    const targetOrgId = resolveOrgId(user, orgId);

    return this.serverApiKeysService.revokeApiKeyByOrg(apiKeyId, targetOrgId);
  }
}
