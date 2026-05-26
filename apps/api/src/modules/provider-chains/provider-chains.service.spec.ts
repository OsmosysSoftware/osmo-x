import { Repository } from 'typeorm';
import { ProviderChainsService } from './provider-chains.service';
import { ProviderChain } from './entities/provider-chain.entity';
import { ApplicationsService } from '../applications/applications.service';
import { ProviderChainMembersService } from '../provider-chain-members/provider-chain-members.service';
import { Status } from 'src/common/constants/database';
import { NotFoundException } from 'src/common/exceptions/app.exception';

type Mocked<T> = { [K in keyof T]: jest.Mock };

interface Bundle {
  service: ProviderChainsService;
  repository: Mocked<Repository<ProviderChain>>;
  membersService: Mocked<ProviderChainMembersService>;
}

function buildService(): Bundle {
  const repository = {
    findOne: jest.fn(),
    find: jest.fn(),
    update: jest.fn().mockResolvedValue(undefined),
    save: jest.fn(),
    create: jest.fn(),
  } as unknown as Mocked<Repository<ProviderChain>>;

  const applicationsService = {} as ApplicationsService;

  const membersService = {
    getAllProviderChainMembersByChainId: jest.fn(),
    softDeleteProviderChainMember: jest.fn().mockResolvedValue(true),
  } as unknown as Mocked<ProviderChainMembersService>;

  const service = new ProviderChainsService(
    repository as unknown as Repository<ProviderChain>,
    applicationsService,
    membersService as unknown as ProviderChainMembersService,
  );

  return { service, repository, membersService };
}

describe('ProviderChainsService', () => {
  describe('softDeleteProviderChain', () => {
    it('throws NotFoundException when the chain does not exist', async () => {
      const { service, repository } = buildService();
      repository.findOne.mockResolvedValue(null);

      await expect(service.softDeleteProviderChain(7)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('soft-deletes every member sequentially before marking the chain inactive', async () => {
      const { service, repository, membersService } = buildService();
      repository.findOne.mockResolvedValue({ chainId: 7, status: Status.ACTIVE });
      membersService.getAllProviderChainMembersByChainId.mockResolvedValue([
        { id: 1 },
        { id: 2 },
        { id: 3 },
      ]);

      const order: string[] = [];
      membersService.softDeleteProviderChainMember.mockImplementation(async (id: number) => {
        order.push(`member-${id}`);
        return true;
      });
      repository.update.mockImplementation(async () => {
        order.push('chain-update');
        return { affected: 1 };
      });

      const result = await service.softDeleteProviderChain(7);

      expect(result).toBe(true);
      expect(membersService.softDeleteProviderChainMember).toHaveBeenCalledTimes(3);
      // FK ordering: members deleted before the chain row update
      expect(order).toEqual(['member-1', 'member-2', 'member-3', 'chain-update']);
      expect(repository.update).toHaveBeenCalledWith(7, { status: Status.INACTIVE });
    });

    it('skips the member-deletion loop when chain has no members', async () => {
      const { service, repository, membersService } = buildService();
      repository.findOne.mockResolvedValue({ chainId: 7, status: Status.ACTIVE });
      membersService.getAllProviderChainMembersByChainId.mockResolvedValue(null);

      const result = await service.softDeleteProviderChain(7);

      expect(result).toBe(true);
      expect(membersService.softDeleteProviderChainMember).not.toHaveBeenCalled();
      expect(repository.update).toHaveBeenCalledWith(7, { status: Status.INACTIVE });
    });

    it('propagates errors from a member soft delete (no chain update happens)', async () => {
      const { service, repository, membersService } = buildService();
      repository.findOne.mockResolvedValue({ chainId: 7, status: Status.ACTIVE });
      membersService.getAllProviderChainMembersByChainId.mockResolvedValue([{ id: 1 }, { id: 2 }]);
      membersService.softDeleteProviderChainMember
        .mockResolvedValueOnce(true)
        .mockRejectedValueOnce(new Error('db error'));

      await expect(service.softDeleteProviderChain(7)).rejects.toThrow('db error');
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('treats an empty member array as no-members (skips loop)', async () => {
      const { service, repository, membersService } = buildService();
      repository.findOne.mockResolvedValue({ chainId: 7, status: Status.ACTIVE });
      membersService.getAllProviderChainMembersByChainId.mockResolvedValue([]);

      await service.softDeleteProviderChain(7);

      expect(membersService.softDeleteProviderChainMember).not.toHaveBeenCalled();
      expect(repository.update).toHaveBeenCalledWith(7, { status: Status.INACTIVE });
    });
  });
});
