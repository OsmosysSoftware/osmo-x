import {
  Body,
  Controller,
  Delete,
  HttpException,
  Logger,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ProviderChainMembersService } from './provider-chain-members.service';
import { JsendFormatter } from 'src/common/jsend-formatter';
import { CreateProviderChainMemberInput } from './dto/create-provider-chain-member.input';
import { UpdateProviderPriorityOrderInput } from './dto/update-provider-priority-order.input';
import { DeleteProviderChainMemberInput } from './dto/delete-chain-member-by-provider.input';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRoles } from 'src/common/constants/database';
import { RolesGuard } from 'src/common/guards/role.guard';

@ApiTags('Provider Chain Members')
@ApiBearerAuth()
@Controller('provider-chain-members')
@Roles(UserRoles.ADMIN)
@UseGuards(RolesGuard)
export class ProviderChainMembersController {
  constructor(
    private readonly providerChainMembersService: ProviderChainMembersService,
    private readonly jsend: JsendFormatter,
    private readonly logger: Logger = new Logger(ProviderChainMembersController.name),
  ) {}

  @Post()
  @ApiOperation({ summary: 'Add a member to a provider chain' })
  @ApiResponse({ status: 201, description: 'Provider chain member created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid provider chain member data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - valid Bearer token required' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin role required' })
  async createProviderChainMember(
    @Body() providerChainMemberData: CreateProviderChainMemberInput,
  ): Promise<Record<string, unknown>> {
    try {
      this.logger.debug(
        `Provider chain member Request Data: ${JSON.stringify(providerChainMemberData)}`,
      );
      const createdProviderChainMember =
        await this.providerChainMembersService.createProviderChainMember(providerChainMemberData);
      this.logger.log('Provider chain member created successfully.');
      return this.jsend.success({ providerChainMember: createdProviderChainMember });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error('Error while creating provider chain member');
      this.logger.error(JSON.stringify(error, ['message', 'stack'], 2));
      throw error;
    }
  }

  @Put('priority-order')
  @ApiOperation({ summary: 'Update priority order of providers in a chain' })
  @ApiResponse({ status: 200, description: 'Provider priority order updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid priority order data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - valid Bearer token required' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin role required' })
  async updateProviderPriorityOrder(
    @Body() updateProviderPriorityOrderData: UpdateProviderPriorityOrderInput,
  ): Promise<Record<string, unknown>> {
    try {
      this.logger.debug(
        `Update provider priority order Request Data: ${JSON.stringify(updateProviderPriorityOrderData)}`,
      );
      const updatedProviderChainMembers =
        await this.providerChainMembersService.updateProviderPriorityOrder(
          updateProviderPriorityOrderData,
        );
      this.logger.log('Provider priority order updated successfully.');
      return this.jsend.success({ updatedProviderChainMembers: updatedProviderChainMembers });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error('Error while updating provider priority order');
      this.logger.error(JSON.stringify(error, ['message', 'stack'], 2));
      throw error;
    }
  }

  @Delete()
  @ApiOperation({ summary: 'Soft-delete a provider chain member by provider ID' })
  @ApiResponse({ status: 200, description: 'Provider chain member deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - valid Bearer token required' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin role required' })
  async deleteProviderChainMemberByProviderId(
    @Body() deleteProviderChainMemberInput: DeleteProviderChainMemberInput,
  ): Promise<Record<string, unknown>> {
    try {
      this.logger.debug(`Deletion request Data: ${JSON.stringify(deleteProviderChainMemberInput)}`);
      const deletedProviderChainMember =
        await this.providerChainMembersService.softDeleteChainMemberUsingProviderID(
          deleteProviderChainMemberInput,
        );

      this.logger.log('Provider chain member deleted successfully.');
      return this.jsend.success({
        deletedProviderChainMember: deletedProviderChainMember,
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error('Error while deleting provider chain member');
      this.logger.error(JSON.stringify(error, ['message', 'stack'], 2));
      throw error;
    }
  }

  @Put('restore')
  @ApiOperation({ summary: 'Restore a soft-deleted provider chain member' })
  @ApiResponse({ status: 200, description: 'Provider chain member restored successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - valid Bearer token required' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin role required' })
  async restoreChainMemberUsingProviderId(
    @Body() restoreProviderChainMemberInput: DeleteProviderChainMemberInput,
  ): Promise<Record<string, unknown>> {
    try {
      this.logger.debug(`Restore Request Data: ${JSON.stringify(restoreProviderChainMemberInput)}`);
      const updatedProviderChainMembers =
        await this.providerChainMembersService.restoreDeletedChainMember(
          restoreProviderChainMemberInput,
        );
      this.logger.log('Provider chain member restored successfully.');
      return this.jsend.success({ updatedProviderChainMembers: updatedProviderChainMembers });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error('Error while restoring provider chain member');
      this.logger.error(JSON.stringify(error, ['message', 'stack'], 2));
      throw error;
    }
  }
}
