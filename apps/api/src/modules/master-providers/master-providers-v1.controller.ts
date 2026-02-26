import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { MasterProvidersService } from './master-providers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/role.guard';
import { MasterProvider } from './entities/master-provider.entity';

@ApiTags('Master Providers')
@ApiBearerAuth()
@Controller('api/v1/master-providers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MasterProvidersV1Controller {
  constructor(private readonly masterProvidersService: MasterProvidersService) {}

  @Get()
  @ApiOperation({ summary: 'List all master providers (read-only catalog)' })
  @ApiResponse({ status: 200, description: 'List of all master providers' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(): Promise<MasterProvider[]> {
    return this.masterProvidersService.findAll();
  }
}
