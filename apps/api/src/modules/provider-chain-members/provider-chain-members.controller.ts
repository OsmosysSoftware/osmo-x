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
import { ApiBearerAuth, ApiExtraModels, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ProviderChainMembersService } from './provider-chain-members.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/role.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRoles } from 'src/common/constants/database';
import { Request } from 'express';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { PaginatedResponse } from 'src/common/dto/paginated-response.dto';
import { LinkBuilder } from 'src/common/utils/link-builder.helper';
import { CreateProviderChainMemberInput } from './dto/create-provider-chain-member.input';
import { UpdateProviderPriorityOrderInput } from './dto/update-provider-priority-order.input';
import { DeleteProviderChainMemberInput } from './dto/delete-chain-member-by-provider.input';
import { ProviderChainMemberResponseDto } from './dto/provider-chain-member-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from 'src/common/constants/jwtInterface';
import { SnakeCaseInterceptor } from 'src/common/interceptors/snake-case.interceptor';

@ApiTags('Provider Chain Members')
@ApiBearerAuth()
@ApiExtraModels(ProviderChainMemberResponseDto)
@Controller('api/v1/provider-chain-members')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(SnakeCaseInterceptor)
@Roles(UserRoles.ORG_ADMIN)
export class ProviderChainMembersController {
  constructor(private readonly providerChainMembersService: ProviderChainMembersService) {}

  @Get()
  @ApiOperation({ summary: 'List provider chain members' })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of provider chain members',
    type: PaginatedResponse,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(
    @Query() query: PaginationQueryDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ): Promise<PaginatedResponse<ProviderChainMemberResponseDto>> {
    const { items, meta } = await this.providerChainMembersService.getAllProviderChainMembersAsDto(
      query,
      user.organizationId,
    );
    const { protocol, host } = LinkBuilder.extractBaseUrl(req);
    const links = LinkBuilder.buildCollectionLinks(protocol, host, req.path, meta);

    return new PaginatedResponse(items, links, meta);
  }

  @Post()
  @ApiOperation({ summary: 'Add a member to a provider chain' })
  @ApiResponse({
    status: 201,
    description: 'Provider chain member created successfully',
    type: ProviderChainMemberResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @Body() createInput: CreateProviderChainMemberInput,
    @CurrentUser() user: JwtPayload,
  ): Promise<ProviderChainMemberResponseDto> {
    return this.providerChainMembersService.createProviderChainMemberAsDto(
      createInput,
      user.organizationId,
    );
  }

  @Put('priority-order')
  @ApiOperation({ summary: 'Update priority order of provider chain members' })
  @ApiResponse({
    status: 200,
    description: 'Priority order updated successfully',
    type: [ProviderChainMemberResponseDto],
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updatePriorityOrder(
    @Body() updateInput: UpdateProviderPriorityOrderInput,
    @CurrentUser() user: JwtPayload,
  ): Promise<ProviderChainMemberResponseDto[]> {
    return this.providerChainMembersService.updateProviderPriorityOrderAsDto(
      updateInput,
      user.organizationId,
    );
  }

  @Delete()
  @ApiOperation({ summary: 'Remove a member from a provider chain' })
  @ApiResponse({
    status: 200,
    description: 'Provider chain member deleted successfully',
    type: ProviderChainMemberResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async remove(
    @Body() deleteInput: DeleteProviderChainMemberInput,
    @CurrentUser() user: JwtPayload,
  ): Promise<ProviderChainMemberResponseDto> {
    return this.providerChainMembersService.softDeleteChainMemberUsingProviderIDAsDto(
      deleteInput,
      user.organizationId,
    );
  }

  @Put('restore')
  @ApiOperation({ summary: 'Restore a deleted provider chain member' })
  @ApiResponse({
    status: 200,
    description: 'Provider chain member restored successfully',
    type: ProviderChainMemberResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async restore(
    @Body() restoreInput: DeleteProviderChainMemberInput,
    @CurrentUser() user: JwtPayload,
  ): Promise<ProviderChainMemberResponseDto> {
    return this.providerChainMembersService.restoreDeletedChainMemberAsDto(
      restoreInput,
      user.organizationId,
    );
  }
}
