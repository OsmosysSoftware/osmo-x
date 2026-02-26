import { BadRequestException, forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { ProviderChain } from './entities/provider-chain.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Status } from 'src/common/constants/database';
import { CoreService } from 'src/common/graphql/services/core.service';
import { QueryOptionsDto } from 'src/common/graphql/dtos/query-options.dto';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { PaginationMeta, PaginationHelper } from 'src/common/utils/pagination.helper';
import { ProviderChainListResponse } from './dto/provider-chain-list.dto';
import { CreateProviderChainInput } from './dto/create-provider-chain.input';
import { ApplicationsService } from '../applications/applications.service';
import { ProviderChainMembersService } from '../provider-chain-members/provider-chain-members.service';
import { UpdateProviderChainInput } from './dto/update-provider-chain.input';
import { ProviderChainResponseDto } from './dto/provider-chain-response.dto';

@Injectable()
export class ProviderChainsService extends CoreService<ProviderChain> {
  protected readonly logger = new Logger(ProviderChainsService.name);
  constructor(
    @InjectRepository(ProviderChain)
    private readonly providerChainRepository: Repository<ProviderChain>,
    private readonly applicationsService: ApplicationsService,
    @Inject(forwardRef(() => ProviderChainMembersService))
    private readonly providerChainMembersService: ProviderChainMembersService,
  ) {
    super(providerChainRepository);
  }

  async getById(chainId: number): Promise<ProviderChain | null> {
    if (chainId === undefined || chainId === null) {
      return null;
    }

    return this.providerChainRepository.findOne({
      where: { chainId, status: Status.ACTIVE },
    });
  }

  async getByProviderChainName(providerChainName: string): Promise<ProviderChain | null> {
    if (providerChainName === undefined || providerChainName === null) {
      return null;
    }

    return this.providerChainRepository.findOne({
      where: { chainName: providerChainName, status: Status.ACTIVE },
    });
  }

  async createProviderChain(providerChainData: CreateProviderChainInput): Promise<ProviderChain> {
    try {
      const providerChainExists = await this.getByProviderChainName(providerChainData.chainName);

      if (providerChainExists) {
        throw new BadRequestException('Provider Chain with same name already exists.');
      }

      const applicationExists = await this.applicationsService.findById(
        providerChainData.applicationId,
      );

      if (!applicationExists) {
        throw new BadRequestException('Invalid applicationId.');
      }

      const providerChain = this.providerChainRepository.create(providerChainData);
      return this.providerChainRepository.save(providerChain);
    } catch (error) {
      throw error;
    }
  }

  async softDeleteProviderChain(chainId: number): Promise<boolean> {
    try {
      const providerChainEntry = await this.getById(chainId);

      if (!providerChainEntry) {
        throw new BadRequestException('Provider chain does not exist');
      }

      const providerChainMemberEntries =
        await this.providerChainMembersService.getAllProviderChainMembersByChainId(chainId);

      if (providerChainMemberEntries && providerChainMemberEntries.length > 0) {
        for (const providerChainMember of providerChainMemberEntries) {
          await this.providerChainMembersService.softDeleteProviderChainMember(
            providerChainMember.id,
          );
        }
      }

      await this.providerChainRepository.update(chainId, {
        status: Status.INACTIVE,
      });
      this.logger.log(`Deleted provider chain ${chainId}`);
      return true;
    } catch (error) {
      throw error;
    }
  }

  async updateProviderChain(
    updateProviderChainData: UpdateProviderChainInput,
  ): Promise<ProviderChain> {
    try {
      const providerChainEntry = await this.getById(updateProviderChainData.chainId);

      if (!providerChainEntry) {
        throw new BadRequestException('Provider chain with inputted id does not exist.');
      }

      // 1. Update chain name
      if (updateProviderChainData.chainName) {
        const providerChainWithInputNameExists = await this.getByProviderChainName(
          updateProviderChainData.chainName,
        );

        if (
          providerChainWithInputNameExists &&
          providerChainWithInputNameExists.chainId !== updateProviderChainData.chainId
        ) {
          throw new BadRequestException('Provider chain with same name already exists.');
        }

        providerChainEntry.chainName = updateProviderChainData.chainName;
      }

      // 2. Update application Id
      if (updateProviderChainData.applicationId) {
        const applicationExists = await this.applicationsService.findById(
          updateProviderChainData.applicationId,
        );

        if (!applicationExists) {
          throw new BadRequestException('Invalid applicationId.');
        }

        providerChainEntry.applicationId = updateProviderChainData.applicationId;
      }

      // 3. Update providerType
      if (updateProviderChainData.providerType) {
        const listOfProviderChainMembers =
          await this.providerChainMembersService.getAllProviderChainMembersByChainId(
            providerChainEntry.chainId,
          );

        if (listOfProviderChainMembers && listOfProviderChainMembers.length > 0) {
          throw new BadRequestException(
            'Delete all existing provider chain members before updating providerType',
          );
        }

        providerChainEntry.providerType = updateProviderChainData.providerType;
      }

      // 4. Update description
      if (updateProviderChainData.description) {
        providerChainEntry.description = updateProviderChainData.description;
      }

      // 5. Update isDefault
      if (updateProviderChainData.isDefault) {
        providerChainEntry.isDefault = updateProviderChainData.isDefault;
      }

      return this.providerChainRepository.save(providerChainEntry);
    } catch (error) {
      throw error;
    }
  }

  private mapToDto(chain: ProviderChain): ProviderChainResponseDto {
    return {
      chainId: chain.chainId,
      chainName: chain.chainName,
      applicationId: chain.applicationId,
      providerType: chain.providerType,
      description: chain.description,
      isDefault: chain.isDefault,
      status: chain.status,
      createdBy: chain.createdBy,
      updatedBy: chain.updatedBy,
      createdOn: chain.createdOn,
      updatedOn: chain.updatedOn,
    };
  }

  async getAllProviderChainsAsDto(
    query: PaginationQueryDto,
    organizationId: number,
  ): Promise<{ items: ProviderChainResponseDto[]; meta: PaginationMeta }> {
    const appIds = await this.applicationsService.getApplicationIdsByOrganization(organizationId);

    if (appIds.length === 0) {
      const { page, limit } = PaginationHelper.normalizePaginationParams(query);

      return {
        items: [],
        meta: PaginationHelper.buildPaginationMeta(page, limit, 0),
      };
    }

    const baseConditions = [
      { field: 'status', value: Status.ACTIVE },
      { field: 'applicationId', value: appIds, operator: 'in' },
    ];
    const searchableFields = ['chainName'];

    const { items, meta } = await super.findAllPaginated(
      query,
      'providerChain',
      searchableFields,
      baseConditions,
    );

    return {
      items: items.map((chain) => this.mapToDto(chain)),
      meta,
    };
  }

  async createProviderChainAsDto(
    providerChainData: CreateProviderChainInput,
    organizationId: number,
  ): Promise<ProviderChainResponseDto> {
    const app = await this.applicationsService.findById(providerChainData.applicationId);

    if (!app || app.organizationId !== organizationId) {
      throw new BadRequestException('Application not found');
    }

    const chain = await this.createProviderChain(providerChainData);

    return this.mapToDto(chain);
  }

  async updateProviderChainAsDto(
    updateProviderChainData: UpdateProviderChainInput,
    organizationId: number,
  ): Promise<ProviderChainResponseDto> {
    const existing = await this.getById(updateProviderChainData.chainId);

    if (!existing) {
      throw new BadRequestException('Provider chain not found');
    }

    const app = await this.applicationsService.findById(existing.applicationId);

    if (!app || app.organizationId !== organizationId) {
      throw new BadRequestException('Provider chain not found');
    }

    const chain = await this.updateProviderChain(updateProviderChainData);

    return this.mapToDto(chain);
  }

  async softDeleteProviderChainByOrg(chainId: number, organizationId: number): Promise<boolean> {
    const existing = await this.getById(chainId);

    if (!existing) {
      throw new BadRequestException('Provider chain not found');
    }

    const app = await this.applicationsService.findById(existing.applicationId);

    if (!app || app.organizationId !== organizationId) {
      throw new BadRequestException('Provider chain not found');
    }

    return this.softDeleteProviderChain(chainId);
  }

  async getAllProviderChains(options: QueryOptionsDto): Promise<ProviderChainListResponse> {
    const baseConditions = [{ field: 'status', value: Status.ACTIVE }];
    const searchableFields = ['chainName'];

    const { items, total } = await super.findAll(
      options,
      'providerChain',
      searchableFields,
      baseConditions,
    );
    return new ProviderChainListResponse(items, total, options.offset, options.limit);
  }
}
