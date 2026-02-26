import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ProvidersService } from './providers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/role.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRoles } from 'src/common/constants/database';
import { QueryOptionsDto } from 'src/common/graphql/dtos/query-options.dto';
import { CreateProviderInput } from './dto/create-provider.input';
import { ProviderResponse } from './dto/provider-response.dto';
import { Provider } from './entities/provider.entity';

@ApiTags('Providers')
@ApiBearerAuth()
@Controller('api/v1/providers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRoles.ORG_ADMIN)
export class ProvidersV1Controller {
  constructor(private readonly providersService: ProvidersService) {}

  @Get()
  @ApiOperation({ summary: 'List providers' })
  @ApiResponse({ status: 200, description: 'Paginated list of providers' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(@Query() options: QueryOptionsDto): Promise<ProviderResponse> {
    return this.providersService.getAllProviders(options);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new provider' })
  @ApiResponse({ status: 201, description: 'Provider created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(@Body() createProviderInput: CreateProviderInput): Promise<Provider> {
    return this.providersService.createProvider(createProviderInput);
  }
}
