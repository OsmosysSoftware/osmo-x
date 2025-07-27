import { Body, Controller, HttpException, Logger, Post } from '@nestjs/common';
import { ProviderChainMembersService } from './provider-chain-members.service';
import { JsendFormatter } from 'src/common/jsend-formatter';
import { CreateProviderChainMemberInput } from './dto/create-provider-chain-member.input';

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
}
