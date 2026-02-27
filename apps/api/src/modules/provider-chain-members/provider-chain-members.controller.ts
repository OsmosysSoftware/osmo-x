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
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
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
import { resolveOrgId } from 'src/common/utils/org-resolver.helper';

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
  @ApiQuery({
    name: 'organization_id',
    required: false,
    type: Number,
    description: 'Target org (SUPER_ADMIN only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of provider chain members',
    type: PaginatedResponse,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(
    @Query() query: PaginationQueryDto,
    @Query('organization_id') queryOrgId: number,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ): Promise<PaginatedResponse<ProviderChainMemberResponseDto>> {
    const targetOrgId = resolveOrgId(user, queryOrgId);
    const { items, meta } = await this.providerChainMembersService.getAllProviderChainMembersAsDto(
      query,
      targetOrgId,
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
    @Body('organizationId') orgId: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<ProviderChainMemberResponseDto> {
    const targetOrgId = resolveOrgId(user, orgId);

    return this.providerChainMembersService.createProviderChainMemberAsDto(
      createInput,
      targetOrgId,
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
    @Body('organizationId') orgId: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<ProviderChainMemberResponseDto[]> {
    const targetOrgId = resolveOrgId(user, orgId);

    return this.providerChainMembersService.updateProviderPriorityOrderAsDto(
      updateInput,
      targetOrgId,
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
    @Body('organizationId') orgId: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<ProviderChainMemberResponseDto> {
    const targetOrgId = resolveOrgId(user, orgId);

    return this.providerChainMembersService.softDeleteChainMemberUsingProviderIDAsDto(
      deleteInput,
      targetOrgId,
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
    @Body('organizationId') orgId: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<ProviderChainMemberResponseDto> {
    const targetOrgId = resolveOrgId(user, orgId);

    return this.providerChainMembersService.restoreDeletedChainMemberAsDto(
      restoreInput,
      targetOrgId,
    );
  }
}
