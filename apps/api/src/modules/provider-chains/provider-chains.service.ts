import { Injectable, Logger } from '@nestjs/common';
import { ProviderChain } from './entities/provider-chain.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Status } from 'src/common/constants/database';
import { CoreService } from 'src/common/graphql/services/core.service';
import { QueryOptionsDto } from 'src/common/graphql/dtos/query-options.dto';
import { ProviderChainResponse } from './dto/provider-chain-response.dto';

@Injectable()
export class ProviderChainsService extends CoreService<ProviderChain> {
  protected readonly logger = new Logger(ProviderChainsService.name);
  constructor(
    @InjectRepository(ProviderChain)
    private readonly providerChainRepository: Repository<ProviderChain>,
  ) {
    super(providerChainRepository);
  }

  async getByProviderChainName(providerChainName: string): Promise<ProviderChain | null> {
    if (providerChainName === undefined || providerChainName === null) {
      return null;
    }

    return this.providerChainRepository.findOne({
      where: { chainName: providerChainName, status: Status.ACTIVE },
    });
  }

  async getAllProviderChains(options: QueryOptionsDto): Promise<ProviderChainResponse> {
    const baseConditions = [{ field: 'status', value: Status.ACTIVE }];
    const searchableFields = ['name'];

    const { items, total } = await super.findAll(
      options,
      'providerChain',
      searchableFields,
      baseConditions,
    );
    return new ProviderChainResponse(items, total, options.offset, options.limit);
  }
}
