import { Body, Controller, Delete, HttpException, Logger, Post, Put } from '@nestjs/common';
import { ProviderChainsService } from './provider-chains.service';
import { JsendFormatter } from 'src/common/jsend-formatter';
import { CreateProviderChainInput } from './dto/create-provider-chain.input';
import { DeleteProviderChainInput } from './dto/delete-provider-chain.input';
import { ProviderChainMembersService } from '../provider-chain-members/provider-chain-members.service';
import { UpdateProviderChainInput } from './dto/update-provider-chain.input';

@Controller('provider-chains')
export class ProviderChainsController {
  constructor(
    private readonly providerChainsService: ProviderChainsService,
    private readonly jsend: JsendFormatter,
    private logger: Logger = new Logger(ProviderChainsController.name),
    private readonly providerChainMembersService: ProviderChainMembersService,
  ) {}

  @Post()
  async addProviderChain(
    @Body() providerChainData: CreateProviderChainInput,
  ): Promise<Record<string, unknown>> {
    try {
      this.logger.debug(`Provider chain Request Data: ${JSON.stringify(providerChainData)}`);
      const createdProviderChain =
        await this.providerChainsService.createProviderChain(providerChainData);
      this.logger.log('Provider chain created successfully.');
      return this.jsend.success({ providerChain: createdProviderChain });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error('Error while creating provider chain');
      this.logger.error(JSON.stringify(error, ['message', 'stack'], 2));
      throw error;
    }
  }

  @Delete()
  async deleteProviderChain(
    @Body() providerChainInput: DeleteProviderChainInput,
  ): Promise<Record<string, unknown>> {
    try {
      this.logger.debug(`Provider chain id to delete: ${providerChainInput}`);
      const entries = await this.providerChainMembersService.getAllProviderChainMembersByChainId(
        providerChainInput.chainId,
      );
      const providerChainMembersDeleted = entries ? entries.map((entry) => entry.id) : null;

      const deletedProviderChain = await this.providerChainsService.softDeleteProviderChain(
        providerChainInput.chainId,
      );
      this.logger.log('Provider chain deleted successfully.');
      return this.jsend.success({
        chainId: providerChainInput.chainId,
        deleted: deletedProviderChain,
        providerChainMembersDeleted: providerChainMembersDeleted,
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error('Error while deleting provider chain');
      this.logger.error(JSON.stringify(error, ['message', 'stack'], 2));
      throw error;
    }
  }

  @Put()
  async updateProviderChain(
    @Body() updateProviderChainData: UpdateProviderChainInput,
  ): Promise<Record<string, unknown>> {
    try {
      this.logger.debug(
        `Provider chain updation Request Data: ${JSON.stringify(updateProviderChainData)}`,
      );
      const createdProviderChain =
        await this.providerChainsService.updateProviderChain(updateProviderChainData);
      this.logger.log('Provider chain updated successfully.');
      return this.jsend.success({ updatedProviderChain: createdProviderChain });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error('Error while updating provider chain');
      this.logger.error(JSON.stringify(error, ['message', 'stack'], 2));
      throw error;
    }
  }
}
