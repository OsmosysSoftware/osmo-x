import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProviderChainMember } from './entities/provider-chain-member.entity';
import { Repository } from 'typeorm';
import { Status } from 'src/common/constants/database';

@Injectable()
export class ProviderChainMembersService {
  protected readonly logger = new Logger(ProviderChainMembersService.name);
  constructor(
    @InjectRepository(ProviderChainMember)
    private readonly providerChainMembersRepository: Repository<ProviderChainMember>,
  ) {}

  async getFirstPriorityProviderIdByChainId(providerChainId: number): Promise<number | null> {
    const providerChainMemberEntry = await this.providerChainMembersRepository.findOne({
      where: {
        chainId: providerChainId,
        isActive: Status.ACTIVE,
        status: Status.ACTIVE,
      },
      order: {
        priorityOrder: 'ASC',
      },
      select: ['providerId'],
    });

    return providerChainMemberEntry?.providerId ?? null;
  }
}
