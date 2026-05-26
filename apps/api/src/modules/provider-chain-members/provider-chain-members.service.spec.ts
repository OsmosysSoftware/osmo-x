import { DataSource, MoreThan, Repository } from 'typeorm';
import { ProviderChainMembersService } from './provider-chain-members.service';
import { ProviderChainMember } from './entities/provider-chain-member.entity';
import { ProviderChainsService } from '../provider-chains/provider-chains.service';
import { ProvidersService } from '../providers/providers.service';
import { MasterProvidersService } from '../master-providers/master-providers.service';
import { ApplicationsService } from '../applications/applications.service';
import { Status } from 'src/common/constants/database';
import { NotFoundException, ValidationException } from 'src/common/exceptions/app.exception';

type Mocked<T> = { [K in keyof T]: jest.Mock };

interface Bundle {
  service: ProviderChainMembersService;
  repository: Mocked<Repository<ProviderChainMember>>;
  providerChainsService: Mocked<ProviderChainsService>;
  queryRunnerManager: { save: jest.Mock; find: jest.Mock; findOne: jest.Mock; delete: jest.Mock };
  queryRunner: {
    connect: jest.Mock;
    startTransaction: jest.Mock;
    commitTransaction: jest.Mock;
    rollbackTransaction: jest.Mock;
    release: jest.Mock;
    manager: unknown;
  };
}

function buildService(
  repoOverrides: Partial<Mocked<Repository<ProviderChainMember>>> = {},
  chainsOverrides: Partial<Mocked<ProviderChainsService>> = {},
): Bundle {
  const repository = {
    findOne: jest.fn(),
    find: jest.fn(),
    findBy: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
    ...repoOverrides,
  } as unknown as Mocked<Repository<ProviderChainMember>>;

  const providerChainsService = {
    getById: jest.fn(),
    getByProviderChainName: jest.fn(),
    ...chainsOverrides,
  } as unknown as Mocked<ProviderChainsService>;

  const providersService = {
    getById: jest.fn(),
  } as unknown as ProvidersService;

  const masterProvidersService = {
    getById: jest.fn(),
  } as unknown as MasterProvidersService;

  const applicationsService = {
    findById: jest.fn(),
  } as unknown as ApplicationsService;

  const queryRunnerManager = {
    save: jest.fn().mockImplementation(async (_type, value) => value),
    find: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
  };
  const queryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: queryRunnerManager,
  };

  const dataSource = {
    createQueryRunner: jest.fn().mockReturnValue(queryRunner),
  } as unknown as DataSource;

  const service = new ProviderChainMembersService(
    repository as unknown as Repository<ProviderChainMember>,
    providerChainsService as unknown as ProviderChainsService,
    providersService,
    masterProvidersService,
    dataSource,
    applicationsService,
  );

  return { service, repository, providerChainsService, queryRunnerManager, queryRunner };
}

describe('ProviderChainMembersService', () => {
  describe('getNextPriorityProvider', () => {
    it('returns the next member id when one exists with priorityOrder > current', async () => {
      const repoFindOne = jest
        .fn()
        // step 1: current member fetch
        .mockResolvedValueOnce({ priorityOrder: 2 })
        // step 2: next member fetch
        .mockResolvedValueOnce({ providerId: 99 });
      const { service, repository } = buildService({ findOne: repoFindOne });

      const result = await service.getNextPriorityProvider(7, 10);

      expect(result).toBe(99);
      expect(repository.findOne).toHaveBeenNthCalledWith(1, {
        where: {
          chainId: 7,
          providerId: 10,
          isActive: Status.ACTIVE,
          status: Status.ACTIVE,
        },
        select: ['priorityOrder'],
      });
      expect(repository.findOne).toHaveBeenNthCalledWith(2, {
        where: {
          chainId: 7,
          priorityOrder: MoreThan(2),
          isActive: Status.ACTIVE,
          status: Status.ACTIVE,
        },
        order: { priorityOrder: 'ASC' },
        select: ['providerId'],
      });
    });

    it('returns null when current is the last (no member with higher priorityOrder)', async () => {
      const repoFindOne = jest
        .fn()
        .mockResolvedValueOnce({ priorityOrder: 3 })
        .mockResolvedValueOnce(null);
      const { service } = buildService({ findOne: repoFindOne });

      const result = await service.getNextPriorityProvider(7, 10);

      expect(result).toBeNull();
    });

    it('returns null when current provider is not a member of the chain', async () => {
      const repoFindOne = jest.fn().mockResolvedValueOnce(null);
      const { service, repository } = buildService({ findOne: repoFindOne });

      const result = await service.getNextPriorityProvider(7, 999);

      expect(result).toBeNull();
      // Second findOne should never fire
      expect(repository.findOne).toHaveBeenCalledTimes(1);
    });

    it('swallows repository errors and returns null (current behavior)', async () => {
      const repoFindOne = jest.fn().mockRejectedValue(new Error('db down'));
      const { service } = buildService({ findOne: repoFindOne });

      const result = await service.getNextPriorityProvider(7, 10);

      expect(result).toBeNull();
    });
  });

  describe('updateProviderPriorityOrder', () => {
    it('throws NotFoundException when the chain does not exist', async () => {
      const { service } = buildService({}, { getById: jest.fn().mockResolvedValue(null) });

      await expect(
        service.updateProviderPriorityOrder({ chainId: 7, newProviderPriorityOrder: [10] }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws ValidationException when newProviderPriorityOrder is empty', async () => {
      const { service } = buildService(
        {},
        { getById: jest.fn().mockResolvedValue({ chainId: 7 }) },
      );

      await expect(
        service.updateProviderPriorityOrder({ chainId: 7, newProviderPriorityOrder: [] }),
      ).rejects.toBeInstanceOf(ValidationException);
    });

    it('throws ValidationException when an element is not a number', async () => {
      const { service } = buildService(
        {},
        { getById: jest.fn().mockResolvedValue({ chainId: 7 }) },
      );

      await expect(
        service.updateProviderPriorityOrder({
          chainId: 7,
          newProviderPriorityOrder: [1, NaN as unknown as number],
        }),
      ).rejects.toBeInstanceOf(ValidationException);
    });

    it('throws NotFoundException when chain has no active members', async () => {
      const { service } = buildService(
        { find: jest.fn().mockResolvedValue([]) },
        { getById: jest.fn().mockResolvedValue({ chainId: 7 }) },
      );

      await expect(
        service.updateProviderPriorityOrder({ chainId: 7, newProviderPriorityOrder: [10] }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws ValidationException when input ids do not match DB ids (missing/extra)', async () => {
      const dbMembers = [
        { id: 1, providerId: 10, priorityOrder: 1 },
        { id: 2, providerId: 11, priorityOrder: 2 },
      ];
      const { service } = buildService(
        { find: jest.fn().mockResolvedValue(dbMembers) },
        { getById: jest.fn().mockResolvedValue({ chainId: 7 }) },
      );

      await expect(
        service.updateProviderPriorityOrder({ chainId: 7, newProviderPriorityOrder: [10, 99] }),
      ).rejects.toBeInstanceOf(ValidationException);
    });

    it('runs two passes inside a transaction: dummy negative priorities then final order', async () => {
      const dbMembers = [
        { id: 1, providerId: 10, priorityOrder: 1 },
        { id: 2, providerId: 11, priorityOrder: 2 },
      ];
      const { service, queryRunnerManager, queryRunner } = buildService(
        {
          find: jest.fn().mockResolvedValue(dbMembers),
          findBy: jest.fn().mockResolvedValue(dbMembers),
        },
        { getById: jest.fn().mockResolvedValue({ chainId: 7 }) },
      );

      await service.updateProviderPriorityOrder({
        chainId: 7,
        newProviderPriorityOrder: [11, 10],
      });

      // Step 4 + Step 5: 2 dummy-save passes + 2 final-save passes = 4 saves total
      expect(queryRunnerManager.save).toHaveBeenCalledTimes(4);
      expect(queryRunner.commitTransaction).toHaveBeenCalled();

      // Final state: provider 11 at priority 1, provider 10 at priority 2
      const provider11 = dbMembers.find((m) => m.providerId === 11);
      const provider10 = dbMembers.find((m) => m.providerId === 10);
      expect(provider11?.priorityOrder).toBe(1);
      expect(provider10?.priorityOrder).toBe(2);
    });

    it('rolls back the transaction when an update fails', async () => {
      const dbMembers = [
        { id: 1, providerId: 10, priorityOrder: 1 },
        { id: 2, providerId: 11, priorityOrder: 2 },
      ];
      const { service, queryRunner, queryRunnerManager } = buildService(
        { find: jest.fn().mockResolvedValue(dbMembers) },
        { getById: jest.fn().mockResolvedValue({ chainId: 7 }) },
      );
      queryRunnerManager.save.mockRejectedValueOnce(new Error('unique violation'));

      await expect(
        service.updateProviderPriorityOrder({
          chainId: 7,
          newProviderPriorityOrder: [11, 10],
        }),
      ).rejects.toThrow('unique violation');

      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.commitTransaction).not.toHaveBeenCalled();
    });
  });
});
