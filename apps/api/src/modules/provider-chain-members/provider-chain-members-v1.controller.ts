import { Body, Controller, Delete, Get, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ProviderChainMembersService } from './provider-chain-members.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/role.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRoles } from 'src/common/constants/database';
import { QueryOptionsDto } from 'src/common/graphql/dtos/query-options.dto';
import { CreateProviderChainMemberInput } from './dto/create-provider-chain-member.input';
import { UpdateProviderPriorityOrderInput } from './dto/update-provider-priority-order.input';
import { DeleteProviderChainMemberInput } from './dto/delete-chain-member-by-provider.input';
import { ProviderChainMemberResponse } from './dto/provider-chain-member-response.dto';
import { ProviderChainMember } from './entities/provider-chain-member.entity';

@ApiTags('Provider Chain Members')
@ApiBearerAuth()
@Controller('api/v1/provider-chain-members')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRoles.ORG_ADMIN)
export class ProviderChainMembersV1Controller {
  constructor(private readonly providerChainMembersService: ProviderChainMembersService) {}

  @Get()
  @ApiOperation({ summary: 'List provider chain members' })
  @ApiResponse({ status: 200, description: 'Paginated list of provider chain members' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(@Query() options: QueryOptionsDto): Promise<ProviderChainMemberResponse> {
    return this.providerChainMembersService.getAllProviderChainMembers(options);
  }

  @Post()
  @ApiOperation({ summary: 'Add a member to a provider chain' })
  @ApiResponse({ status: 201, description: 'Provider chain member created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(@Body() createInput: CreateProviderChainMemberInput): Promise<ProviderChainMember> {
    return this.providerChainMembersService.createProviderChainMember(createInput);
  }

  @Put('priority-order')
  @ApiOperation({ summary: 'Update priority order of provider chain members' })
  @ApiResponse({ status: 200, description: 'Priority order updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updatePriorityOrder(
    @Body() updateInput: UpdateProviderPriorityOrderInput,
  ): Promise<ProviderChainMember[]> {
    return this.providerChainMembersService.updateProviderPriorityOrder(updateInput);
  }

  @Delete()
  @ApiOperation({ summary: 'Remove a member from a provider chain' })
  @ApiResponse({ status: 200, description: 'Provider chain member deleted successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async remove(@Body() deleteInput: DeleteProviderChainMemberInput): Promise<ProviderChainMember> {
    return this.providerChainMembersService.softDeleteChainMemberUsingProviderID(deleteInput);
  }

  @Put('restore')
  @ApiOperation({ summary: 'Restore a deleted provider chain member' })
  @ApiResponse({ status: 200, description: 'Provider chain member restored successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async restore(
    @Body() restoreInput: DeleteProviderChainMemberInput,
  ): Promise<ProviderChainMember> {
    return this.providerChainMembersService.restoreDeletedChainMember(restoreInput);
  }
}
