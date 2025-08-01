import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProviderChainMember } from './entities/provider-chain-member.entity';
import { DataSource, MoreThan, Repository } from 'typeorm';
import { IsEnabledStatus, Status } from 'src/common/constants/database';
import { CoreService } from 'src/common/graphql/services/core.service';
import { QueryOptionsDto } from 'src/common/graphql/dtos/query-options.dto';
import { ProviderChainMemberResponse } from './dto/provider-chain-member-response.dto';
import { CreateProviderChainMemberInput } from './dto/create-provider-chain-member.input';
import { ProviderChainsService } from '../provider-chains/provider-chains.service';
import { ProvidersService } from '../providers/providers.service';
import { MasterProvidersService } from '../master-providers/master-providers.service';
import { UpdateProviderPriorityOrderInput } from './dto/update-provider-priority-order.input';
import { DeleteProviderChainMemberInput } from './dto/delete-chain-member-by-provider.input';

@Injectable()
export class ProviderChainMembersService extends CoreService<ProviderChainMember> {
  protected readonly logger = new Logger(ProviderChainMembersService.name);
  constructor(
    @InjectRepository(ProviderChainMember)
    private readonly providerChainMemberRepository: Repository<ProviderChainMember>,
    private readonly providerChainsService: ProviderChainsService,
    private readonly providersService: ProvidersService,
    private readonly masterProvidersService: MasterProvidersService,
    private readonly dataSource: DataSource,
  ) {
    super(providerChainMemberRepository);
  }

  async getById(id: number): Promise<ProviderChainMember | null> {
    if (id === undefined || id === null) {
      return null;
    }

    return this.providerChainMemberRepository.findOne({
      where: { id, status: Status.ACTIVE },
    });
  }

  async getFirstPriorityProviderChainMemberByChainId(
    providerChainId: number,
  ): Promise<ProviderChainMember | null> {
    const providerChainMemberEntry = await this.providerChainMemberRepository.findOne({
      where: {
        chainId: providerChainId,
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
        status: Status.ACTIVE,
      },
      order: {
        priorityOrder: 'DESC',
      },
    });

    return providerChainMemberEntry ? providerChainMemberEntry : null;
  }

  async getAllProviderChainMembersByChainId(
    providerChainId: number,
  ): Promise<ProviderChainMember[] | null> {
    const providerChainMembers = await this.providerChainMemberRepository.find({
      where: {
        chainId: providerChainId,
        status: Status.ACTIVE,
      },
    });

    if (!providerChainMembers.length) {
      this.logger.debug(
        `No active provider chain members found for providerChainId ${providerChainId}`,
      );
      return null;
    }

    return providerChainMembers;
  }

  async softDeleteProviderChainMember(providerChainMemberId: number): Promise<boolean> {
    const providerChainMemberEntry = await this.getById(providerChainMemberId);

    if (!providerChainMemberEntry) {
      throw new BadRequestException('Provider chain member does not exist');
    }

    await this.providerChainMemberRepository.update(providerChainMemberId, {
      status: Status.INACTIVE,
    });
    this.logger.log(`Deleted provider chain member ${providerChainMemberId}`);
    return true;
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

      const ifProviderHasAlreadyBeenAddedToProviderChain =
        await this.checkIfProviderHasAlreadyBeenAddedToProviderChain(
          providerChainMemberData.chainId,
          providerChainMemberData.providerId,
        );

      if (ifProviderHasAlreadyBeenAddedToProviderChain) {
        throw new BadRequestException(
          'Provider has already been added to the chain. It may or may not have been deleted.',
        );
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
      },
    });

    return providerChainMemberEntry ? true : false;
  }

  async updateProviderPriorityOrder(
    updateData: UpdateProviderPriorityOrderInput,
  ): Promise<ProviderChainMember[]> {
    try {
      const providerChainExists = await this.providerChainsService.getById(updateData.chainId);

      if (!providerChainExists) {
        throw new BadRequestException('Provider Chain does not exist.');
      }

      const providerPriorityOrderArray = updateData.newProviderPriorityOrder;

      if (!Array.isArray(providerPriorityOrderArray) || providerPriorityOrderArray.length === 0) {
        throw new BadRequestException('Provider priority order is empty or invalid');
      }

      if (providerPriorityOrderArray.some((p) => typeof p !== 'number' || isNaN(p))) {
        throw new BadRequestException(
          'All elements in newProviderPriorityOrder must be valid providerIds of type number.',
        );
      }

      // Step 1: Fetch all members belonging to chain id
      const chainMembersFromDB = await this.providerChainMemberRepository.find({
        where: {
          chainId: updateData.chainId,
          status: Status.ACTIVE,
        },
      });

      if (chainMembersFromDB.length <= 0) {
        throw new BadRequestException(`No members added for provider chain ${updateData.chainId}`);
      }

      // Step 2: Validate all input providers exist in DB (no missing or extra)
      const providerIdsFromDB = chainMembersFromDB.map((chainMember) => chainMember.providerId);

      const missing = providerIdsFromDB.filter((id) => !providerPriorityOrderArray.includes(id));
      const extra = providerPriorityOrderArray.filter((id) => !providerIdsFromDB.includes(id));

      if (missing.length > 0 || extra.length > 0) {
        throw new BadRequestException(
          `Mismatch between input and DB provider ids. Missing: ${missing}, Extra: ${extra}`,
        );
      }

      // Step 3: Run updates in a transaction
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        // Step 4: Temporarily set provider to unique dummy values
        for (const chainMember of chainMembersFromDB) {
          chainMember.priorityOrder = -1 * chainMember.id; // guaranteed unique & not conflicting
          await queryRunner.manager.save(ProviderChainMember, chainMember);
        }

        // Step 5: Set final provider and priority
        for (let i = 0; i < providerPriorityOrderArray.length; i++) {
          const providerId = providerPriorityOrderArray[i];
          const chainMemberToUpdate = chainMembersFromDB.find((m) => m.providerId === providerId);

          // Shouldn't happen due to validation
          if (!chainMemberToUpdate) continue;

          // Update priority order
          chainMemberToUpdate.priorityOrder = i + 1;

          await queryRunner.manager.save(ProviderChainMember, chainMemberToUpdate);
        }

        await queryRunner.commitTransaction();
      } catch (error) {
        await queryRunner.rollbackTransaction();
        this.logger.error(
          `Error while updating priority order. Rolling back transaction: ${error.message}`,
        );
        throw error;
      } finally {
        await queryRunner.release();
      }

      return await this.providerChainMemberRepository.findBy({
        chainId: updateData.chainId,
        status: Status.ACTIVE,
      });
    } catch (error) {
      throw error;
    }
  }

  async softDeleteChainMemberUsingProviderID(
    deletionData: DeleteProviderChainMemberInput,
  ): Promise<ProviderChainMember> {
    try {
      const providerChainExists = await this.providerChainsService.getById(deletionData.chainId);

      if (!providerChainExists) {
        throw new BadRequestException('Provider Chain does not exist.');
      }

      const ifProviderHasAlreadyBeenAddedToProviderChain =
        await this.checkIfProviderHasAlreadyBeenAddedToProviderChain(
          deletionData.chainId,
          deletionData.providerId,
        );

      if (!ifProviderHasAlreadyBeenAddedToProviderChain) {
        throw new BadRequestException('Provider does not exist in the chain.');
      }

      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        // Step 1: Get the member to delete
        const chainMemberToDelete = await queryRunner.manager.findOne(ProviderChainMember, {
          where: {
            chainId: deletionData.chainId,
            providerId: deletionData.providerId,
            status: Status.ACTIVE,
          },
        });

        if (!chainMemberToDelete) {
          throw new BadRequestException('Chain member has already been deleted');
        }

        const deletedPriority = chainMemberToDelete.priorityOrder;

        // Step 2: Soft delete the member
        chainMemberToDelete.status = Status.INACTIVE;
        chainMemberToDelete.priorityOrder = -1 * chainMemberToDelete.id;
        await queryRunner.manager.save(ProviderChainMember, chainMemberToDelete);

        // Step 3: Fetch affected members
        const membersToShift = await queryRunner.manager.find(ProviderChainMember, {
          where: {
            chainId: deletionData.chainId,
            status: Status.ACTIVE,
            priorityOrder: MoreThan(deletedPriority),
          },
          order: { priorityOrder: 'ASC' },
        });

        // Step 4: Shift priority order in memory
        for (const member of membersToShift) {
          member.priorityOrder -= 1;
        }

        // Step 5: Batch save
        if (membersToShift.length > 0) {
          await queryRunner.manager.save(ProviderChainMember, membersToShift);
        }

        await queryRunner.commitTransaction();
        return chainMemberToDelete;
      } catch (error) {
        await queryRunner.rollbackTransaction();
        this.logger.error(
          `Error while soft deleting chain member. Rolling back transaction: ${error.message}`,
        );
        throw error;
      } finally {
        await queryRunner.release();
      }
    } catch (error) {
      throw error;
    }
  }

  async restoreDeletedChainMember(
    deletedChainMemberData: DeleteProviderChainMemberInput,
  ): Promise<ProviderChainMember> {
    try {
      const providerChainExists = await this.providerChainsService.getById(
        deletedChainMemberData.chainId,
      );

      if (!providerChainExists) {
        throw new BadRequestException('Provider Chain does not exist.');
      }

      const deletedChainMemberEntry = await this.providerChainMemberRepository.findOne({
        where: {
          chainId: deletedChainMemberData.chainId,
          providerId: deletedChainMemberData.providerId,
          status: Status.INACTIVE,
        },
      });

      if (!deletedChainMemberEntry) {
        throw new BadRequestException('Provider Id not found or is already active');
      }

      const lastPriorityMember = await this.getLastPriorityProviderChainMemberByChainId(
        deletedChainMemberData.chainId,
      );

      deletedChainMemberEntry.priorityOrder = lastPriorityMember
        ? lastPriorityMember.priorityOrder + 1
        : 1;

      deletedChainMemberEntry.status = Status.ACTIVE;
      return this.providerChainMemberRepository.save(deletedChainMemberEntry);
    } catch (error) {
      throw error;
    }
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
