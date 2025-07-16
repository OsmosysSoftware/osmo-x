import { Injectable, Logger } from '@nestjs/common';
import { ProviderChain } from './entities/provider-chain.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Status } from 'src/common/constants/database';

@Injectable()
export class ProviderChainsService {
  protected readonly logger = new Logger(ProviderChainsService.name);
  constructor(
    @InjectRepository(ProviderChain)
    private readonly providerChainRepository: Repository<ProviderChain>,
  ) {}

  async getByProviderChainName(providerChainName: string): Promise<ProviderChain | null> {
    if (providerChainName === undefined || providerChainName === null) {
      return null;
    }

    return this.providerChainRepository.findOne({
      where: { chainName: providerChainName, status: Status.ACTIVE },
    });
  }
}
