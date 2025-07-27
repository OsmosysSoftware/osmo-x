import { Body, Controller, HttpException, Logger, Post, Put } from '@nestjs/common';
import { ProviderChainMembersService } from './provider-chain-members.service';
import { JsendFormatter } from 'src/common/jsend-formatter';
import { CreateProviderChainMemberInput } from './dto/create-provider-chain-member.input';
import { UpdateProviderPriorityOrderInput } from './dto/update-provider-priority-order.input';

@Controller('provider-chain-members')
export class ProviderChainMembersController {
  constructor(
    private readonly providerChainMembersService: ProviderChainMembersService,
    private readonly jsend: JsendFormatter,
    private readonly logger: Logger = new Logger(ProviderChainMembersController.name),
  ) {}

  @Post()
  async addProviderChain(
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
}
