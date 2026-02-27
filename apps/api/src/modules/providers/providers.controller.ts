import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiExtraModels, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ProvidersService } from './providers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/role.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRoles } from 'src/common/constants/database';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from 'src/common/constants/jwtInterface';
import { Request } from 'express';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { PaginatedResponse } from 'src/common/dto/paginated-response.dto';
import { LinkBuilder } from 'src/common/utils/link-builder.helper';
import { CreateProviderInput } from './dto/create-provider.input';
import { UpdateProviderInput } from './dto/update-provider.input';
import { ProviderResponseDto } from './dto/provider-response.dto';
import { SnakeCaseInterceptor } from 'src/common/interceptors/snake-case.interceptor';

@ApiTags('Providers')
@ApiBearerAuth()
@ApiExtraModels(ProviderResponseDto)
@Controller('api/v1/providers')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(SnakeCaseInterceptor)
@Roles(UserRoles.ORG_ADMIN)
export class ProvidersController {
  constructor(private readonly providersService: ProvidersService) {}

  @Get()
  @ApiOperation({ summary: 'List providers' })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of providers',
    type: PaginatedResponse,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(
    @Query() query: PaginationQueryDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ): Promise<PaginatedResponse<ProviderResponseDto>> {
    const { items, meta } = await this.providersService.getAllProvidersAsDto(
      query,
      user.organizationId,
    );
    const { protocol, host } = LinkBuilder.extractBaseUrl(req);
    const links = LinkBuilder.buildCollectionLinks(protocol, host, req.path, meta);

    return new PaginatedResponse(items, links, meta);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get provider by ID' })
  @ApiResponse({ status: 200, description: 'Provider details', type: ProviderResponseDto })
  @ApiResponse({ status: 400, description: 'Provider not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findOne(
    @Param('id') id: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<ProviderResponseDto> {
    return this.providersService.findByIdAsDto(id, user.organizationId);
  }

  @Put()
  @ApiOperation({ summary: 'Update an existing provider' })
  @ApiResponse({ status: 200, description: 'Provider updated', type: ProviderResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async update(
    @Body() updateProviderInput: UpdateProviderInput,
    @CurrentUser() user: JwtPayload,
  ): Promise<ProviderResponseDto> {
    return this.providersService.updateProviderAsDto(
      updateProviderInput,
      user.organizationId,
      user.userId,
    );
  }

  @Post()
  @ApiOperation({ summary: 'Create a new provider' })
  @ApiResponse({
    status: 201,
    description: 'Provider created successfully',
    type: ProviderResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @Body() createProviderInput: CreateProviderInput,
    @CurrentUser() user: JwtPayload,
  ): Promise<ProviderResponseDto> {
    return this.providersService.createProviderAsDto(
      createProviderInput,
      user.organizationId,
      user.userId,
    );
  }

  @Delete()
  @ApiOperation({ summary: 'Delete a provider' })
  @ApiResponse({ status: 200, description: 'Provider deleted' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async remove(
    @Body('providerId') providerId: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<boolean> {
    return this.providersService.softDeleteProviderAsDto(providerId, user.organizationId);
  }
}
