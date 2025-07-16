import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProviderChainMember } from './entities/provider-chain-member.entity';
import { MoreThan, Repository } from 'typeorm';
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

  async getAllProviderChainMembersByChainId(
    providerChainId: number,
  ): Promise<ProviderChainMember[] | null> {
    const providerChainMembers = await this.providerChainMembersRepository.find({
      where: {
        chainId: providerChainId,
        isActive: Status.ACTIVE,
        status: Status.ACTIVE,
      },
    });

    if (!providerChainMembers.length) {
      this.logger.debug(`No active providers found for providerChainId ${providerChainId}`);
      return null;
    }

    return providerChainMembers;
  }

  async getNextPriorityProvider(
    providerChainId: number,
    currentProviderId: number,
  ): Promise<number | null> {
    try {
      // Step 1: Find current provider's priority
      const currentProviderChainMemberEntry = await this.providerChainMembersRepository.findOne({
        where: {
          chainId: providerChainId,
          providerId: currentProviderId,
          isActive: Status.ACTIVE,
          status: Status.ACTIVE,
        },
        select: ['priorityOrder'],
      });

      if (!currentProviderChainMemberEntry) {
        this.logger.warn(
          `No active member found for providerId ${currentProviderId} on chain ${providerChainId}`,
        );
        return null;
      }

      // Step 2: Find next provider with higher priorityOrder
      const nextPriorityProviderId = await this.providerChainMembersRepository.findOne({
        where: {
          chainId: providerChainId,
          priorityOrder: MoreThan(currentProviderChainMemberEntry.priorityOrder),
          isActive: Status.ACTIVE,
          status: Status.ACTIVE,
        },
        order: {
          priorityOrder: 'ASC',
        },
        select: ['providerId'],
      });

      return nextPriorityProviderId?.providerId ?? null;
    } catch (error) {
      const msg = `Error fetching next priority provider for providerId ${currentProviderId} on chain ${providerChainId}: ${error.message}`;
      this.logger.error(msg, error.stack);
      // TODO: Temporary logic of returning null to avoid throwing uncaught errors
      return null;
    }
  }
}
