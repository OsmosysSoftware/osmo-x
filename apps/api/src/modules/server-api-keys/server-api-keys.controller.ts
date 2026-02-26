import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiExtraModels, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ServerApiKeysService } from './server-api-keys.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/role.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRoles } from 'src/common/constants/database';
import { ServerApiKeyResponseDto } from './dto/server-api-key-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from 'src/common/constants/jwtInterface';

@ApiTags('API Keys')
@ApiBearerAuth()
@ApiExtraModels(ServerApiKeyResponseDto)
@Controller('api/v1/api-keys')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRoles.ORG_ADMIN)
export class ServerApiKeysController {
  constructor(private readonly serverApiKeysService: ServerApiKeysService) {}

  @Get()
  @ApiOperation({ summary: 'List API keys for an application' })
  @ApiResponse({
    status: 200,
    description: 'List of API keys for the specified application',
    type: [ServerApiKeyResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(
    @Query('applicationId') applicationId: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<ServerApiKeyResponseDto[]> {
    return this.serverApiKeysService.findByRelatedApplicationIdAsDto(
      applicationId,
      user.organizationId,
    );
  }

  @Post()
  @ApiOperation({ summary: 'Generate a new API key for an application' })
  @ApiResponse({ status: 201, description: 'API key generated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async generate(
    @Body('applicationId') applicationId: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<string> {
    return this.serverApiKeysService.generateApiKeyByOrg(applicationId, user.organizationId);
  }
}
