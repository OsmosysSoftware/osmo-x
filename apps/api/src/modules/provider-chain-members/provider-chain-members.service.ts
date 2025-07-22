import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProviderChainMember } from './entities/provider-chain-member.entity';
import { Repository } from 'typeorm';
import { Status } from 'src/common/constants/database';
import { CoreService } from 'src/common/graphql/services/core.service';
import { QueryOptionsDto } from 'src/common/graphql/dtos/query-options.dto';
import { ProviderChainMemberResponse } from './dto/provider-chain-member-response.dto';

@Injectable()
export class ProviderChainMembersService extends CoreService<ProviderChainMember> {
  protected readonly logger = new Logger(ProviderChainMembersService.name);
  constructor(
    @InjectRepository(ProviderChainMember)
    private readonly providerChainMembersRepository: Repository<ProviderChainMember>,
  ) {
    super(providerChainMembersRepository);
  }

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

  async getAllProviderChainMembers(options: QueryOptionsDto): Promise<ProviderChainMemberResponse> {
    const baseConditions = [{ field: 'status', value: Status.ACTIVE }];
    const searchableFields = ['name'];

    const { items, total } = await super.findAll(
      options,
      'providerChainMember',
      searchableFields,
      baseConditions,
    );
    return new ProviderChainMemberResponse(items, total, options.offset, options.limit);
  }
}
