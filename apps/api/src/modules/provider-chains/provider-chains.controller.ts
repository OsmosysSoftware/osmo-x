import { Body, Controller, HttpException, Logger, Post } from '@nestjs/common';
import { ProviderChainsService } from './provider-chains.service';
import { JsendFormatter } from 'src/common/jsend-formatter';
import { CreateProviderChainInput } from './dto/create-provider-chain.input';

@Controller('provider-chains')
export class ProviderChainsController {
  constructor(
    private readonly providerChainsService: ProviderChainsService,
    private readonly jsend: JsendFormatter,
    private logger: Logger = new Logger(ProviderChainsController.name),
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
}
