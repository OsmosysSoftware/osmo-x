import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiExtraModels, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { MasterProvidersService } from './master-providers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/role.guard';
import { MasterProviderResponseDto } from './dto/master-provider-response.dto';

@ApiTags('Master Providers')
@ApiBearerAuth()
@ApiExtraModels(MasterProviderResponseDto)
@Controller('api/v1/master-providers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MasterProvidersController {
  constructor(private readonly masterProvidersService: MasterProvidersService) {}

  @Get()
  @ApiOperation({ summary: 'List all master providers (read-only catalog)' })
  @ApiResponse({
    status: 200,
    description: 'List of all master providers',
    type: [MasterProviderResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(): Promise<MasterProviderResponseDto[]> {
    return this.masterProvidersService.findAllAsDto();
  }
}
