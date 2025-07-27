import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProviderChainMember } from './entities/provider-chain-member.entity';
import { Repository } from 'typeorm';
import { IsEnabledStatus, Status } from 'src/common/constants/database';
import { CoreService } from 'src/common/graphql/services/core.service';
import { QueryOptionsDto } from 'src/common/graphql/dtos/query-options.dto';
import { ProviderChainMemberResponse } from './dto/provider-chain-member-response.dto';
import { CreateProviderChainMemberInput } from './dto/create-provider-chain-member.input';
import { ProviderChainsService } from '../provider-chains/provider-chains.service';
import { ProvidersService } from '../providers/providers.service';
import { MasterProvidersService } from '../master-providers/master-providers.service';

@Injectable()
export class ProviderChainMembersService extends CoreService<ProviderChainMember> {
  protected readonly logger = new Logger(ProviderChainMembersService.name);
  constructor(
    @InjectRepository(ProviderChainMember)
    private readonly providerChainMemberRepository: Repository<ProviderChainMember>,
    private readonly providerChainsService: ProviderChainsService,
    private readonly providersService: ProvidersService,
    private readonly masterProvidersService: MasterProvidersService,
  ) {
    super(providerChainMemberRepository);
  }

  async getFirstPriorityProviderChainMemberByChainId(
    providerChainId: number,
  ): Promise<ProviderChainMember | null> {
    const providerChainMemberEntry = await this.providerChainMemberRepository.findOne({
      where: {
        chainId: providerChainId,
        isActive: Status.ACTIVE,
        status: Status.ACTIVE,
      },
      order: {
        priorityOrder: 'ASC',
      },
    });

    return providerChainMemberEntry ? providerChainMemberEntry : null;
  }

  async getLastPriorityProviderChainMemberByChainId(
    providerChainId: number,
  ): Promise<ProviderChainMember | null> {
    const providerChainMemberEntry = await this.providerChainMemberRepository.findOne({
      where: {
        chainId: providerChainId,
        isActive: Status.ACTIVE,
        status: Status.ACTIVE,
      },
      order: {
        priorityOrder: 'DESC',
      },
    });

    return providerChainMemberEntry ? providerChainMemberEntry : null;
  }

  async createProviderChainMember(
    providerChainMemberData: CreateProviderChainMemberInput,
  ): Promise<ProviderChainMember> {
    try {
      const providerChainExists = await this.providerChainsService.getById(
        providerChainMemberData.chainId,
      );

      if (!providerChainExists) {
        throw new BadRequestException('Provider Chain does not exist.');
      }

      const providerExists = await this.providersService.getById(
        providerChainMemberData.providerId,
      );

      if (!providerExists || providerExists.isEnabled === IsEnabledStatus.FALSE) {
        throw new BadRequestException('Provider does not exist or is not enabled.');
      }

      if (providerChainExists.applicationId !== providerExists.applicationId) {
        throw new BadRequestException(
          'Provider and provider chain do not belong to the same application',
        );
      }

      if (
        await this.checkIfProviderHasAlreadyBeenAddedToProviderChain(
          providerChainMemberData.chainId,
          providerChainMemberData.providerId,
        )
      ) {
        throw new BadRequestException('Provider has already been added to the chain');
      }

      const masterProviderExists = await this.masterProvidersService.getById(
        providerExists.channelType,
      );

      if (!masterProviderExists) {
        throw new BadRequestException('Master provider does not exist.');
      }

      if (providerChainExists.providerType !== masterProviderExists.providerType) {
        throw new BadRequestException(
          'The provider type of the input provider id does not match the provider type configured in the provider chain.',
        );
      }

      const lastPriorityMember = await this.getLastPriorityProviderChainMemberByChainId(
        providerChainMemberData.chainId,
      );

      const updatedProviderChainMemberData: ProviderChainMember = new ProviderChainMember({
        priorityOrder: lastPriorityMember ? lastPriorityMember.priorityOrder + 1 : 1,
        ...providerChainMemberData,
      });

      const providerChainMember = this.providerChainMemberRepository.create(
        updatedProviderChainMemberData,
      );
      return this.providerChainMemberRepository.save(providerChainMember);
    } catch (error) {
      throw error;
    }
  }

  async checkIfProviderHasAlreadyBeenAddedToProviderChain(
    chainId: number,
    providerId: number,
  ): Promise<boolean> {
    const providerChainMemberEntry = await this.providerChainMemberRepository.findOne({
      where: {
        chainId: chainId,
        providerId: providerId,
        isActive: Status.ACTIVE,
        status: Status.ACTIVE,
      },
    });

    return providerChainMemberEntry ? true : false;
  }

  async getAllProviderChainMembers(options: QueryOptionsDto): Promise<ProviderChainMemberResponse> {
    const baseConditions = [{ field: 'status', value: Status.ACTIVE }];
    const searchableFields = [];

    const { items, total } = await super.findAll(
      options,
      'providerChainMember',
      searchableFields,
      baseConditions,
    );
    return new ProviderChainMemberResponse(items, total, options.offset, options.limit);
  }
}
