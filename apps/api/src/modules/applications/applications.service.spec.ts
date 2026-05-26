import { DataSource, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { ApplicationsService } from './applications.service';
import { Application } from './entities/application.entity';
import { UsersService } from '../users/users.service';
import { ProvidersService } from '../providers/providers.service';

type Mocked<T> = { [K in keyof T]: jest.Mock };

interface Bundle {
  service: ApplicationsService;
  providersService: Mocked<ProvidersService>;
}

function buildService(providers: Record<number, unknown>): Bundle {
  const repository = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  } as unknown as Repository<Application>;

  const usersService = {} as UsersService;

  const providersService = {
    getById: jest.fn().mockImplementation(async (id: number) => providers[id] ?? null),
  } as unknown as Mocked<ProvidersService>;

  const configService = {} as ConfigService;
  const dataSource = {} as DataSource;

  const service = new ApplicationsService(
    repository,
    usersService,
    providersService as unknown as ProvidersService,
    configService,
    dataSource,
  );

  return { service, providersService };
}

describe('ApplicationsService', () => {
  describe('verifyWhitelist', () => {
    it('returns true when every key resolves to an active provider and every value is a string[]', async () => {
      const { service } = buildService({
        10: { providerId: 10, applicationId: 100 },
        11: { providerId: 11, applicationId: 100 },
      });

      const whitelist = { '10': ['a@x.com'], '11': ['*'] } as unknown as string;
      const result = await service.verifyWhitelist(whitelist);

      expect(result).toBe(true);
    });

    it('returns false when a provider id does not exist', async () => {
      const { service } = buildService({});

      const whitelist = { '99': ['a@x.com'] } as unknown as string;
      const result = await service.verifyWhitelist(whitelist);

      expect(result).toBe(false);
    });

    it('returns false when a provider does not belong to the supplied application id', async () => {
      const { service } = buildService({
        10: { providerId: 10, applicationId: 999 },
      });

      const whitelist = { '10': ['a@x.com'] } as unknown as string;
      const result = await service.verifyWhitelist(whitelist, 100);

      expect(result).toBe(false);
    });

    it('returns true when applicationId matches the provider applicationId', async () => {
      const { service } = buildService({
        10: { providerId: 10, applicationId: 100 },
      });

      const whitelist = { '10': ['a@x.com'] } as unknown as string;
      const result = await service.verifyWhitelist(whitelist, 100);

      expect(result).toBe(true);
    });

    it('returns false when a value is not an array', async () => {
      const { service } = buildService({
        10: { providerId: 10, applicationId: 100 },
      });

      const whitelist = { '10': 'not-an-array' } as unknown as string;
      const result = await service.verifyWhitelist(whitelist);

      expect(result).toBe(false);
    });

    it('returns false when an element of the array is not a string', async () => {
      const { service } = buildService({
        10: { providerId: 10, applicationId: 100 },
      });

      const whitelist = { '10': ['ok', 42] } as unknown as string;
      const result = await service.verifyWhitelist(whitelist);

      expect(result).toBe(false);
    });

    it('queries providers serially for each whitelist key', async () => {
      const { service, providersService } = buildService({
        10: { providerId: 10, applicationId: 100 },
        11: { providerId: 11, applicationId: 100 },
        12: { providerId: 12, applicationId: 100 },
      });

      const whitelist = { '10': ['a'], '11': ['b'], '12': ['c'] } as unknown as string;
      await service.verifyWhitelist(whitelist);

      expect(providersService.getById).toHaveBeenCalledTimes(3);
      expect(providersService.getById).toHaveBeenCalledWith(10);
      expect(providersService.getById).toHaveBeenCalledWith(11);
      expect(providersService.getById).toHaveBeenCalledWith(12);
    });
  });
});
