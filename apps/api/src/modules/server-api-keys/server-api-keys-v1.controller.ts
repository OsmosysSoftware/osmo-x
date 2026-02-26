import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ServerApiKeysService } from './server-api-keys.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/role.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRoles } from 'src/common/constants/database';
import { ServerApiKey } from './entities/server-api-key.entity';

@ApiTags('API Keys')
@ApiBearerAuth()
@Controller('api/v1/api-keys')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRoles.ORG_ADMIN)
export class ServerApiKeysV1Controller {
  constructor(private readonly serverApiKeysService: ServerApiKeysService) {}

  @Get()
  @ApiOperation({ summary: 'List API keys for an application' })
  @ApiResponse({ status: 200, description: 'List of API keys for the specified application' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(@Query('applicationId') applicationId: number): Promise<ServerApiKey[]> {
    return this.serverApiKeysService.findByRelatedApplicationId(applicationId);
  }

  @Post()
  @ApiOperation({ summary: 'Generate a new API key for an application' })
  @ApiResponse({ status: 201, description: 'API key generated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async generate(@Body('applicationId') applicationId: number): Promise<string> {
    return this.serverApiKeysService.generateApiKey(applicationId);
  }
}
