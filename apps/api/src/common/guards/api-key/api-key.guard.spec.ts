jest.mock('src/common/utils/bcrypt', () => ({
  compareApiKeys: jest.fn(),
}));

import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ApiKeyGuard } from './api-key.guard';
import { ServerApiKeysService } from 'src/modules/server-api-keys/server-api-keys.service';
import { ProvidersService } from 'src/modules/providers/providers.service';
import { ProviderChainsService } from 'src/modules/provider-chains/provider-chains.service';
import { IsEnabledStatus } from 'src/common/constants/database';
import { compareApiKeys } from 'src/common/utils/bcrypt';

type Mocked<T> = { [K in keyof T]: jest.Mock };

interface Bundle {
  guard: ApiKeyGuard;
  serverApiKeysService: Mocked<ServerApiKeysService>;
  providersService: Mocked<ProvidersService>;
  providerChainsService: Mocked<ProviderChainsService>;
}

function buildGuard(): Bundle {
  const serverApiKeysService = {
    findByRelatedApplicationId: jest.fn(),
  } as unknown as Mocked<ServerApiKeysService>;

  const providersService = {
    getById: jest.fn(),
  } as unknown as Mocked<ProvidersService>;

  const providerChainsService = {
    getByProviderChainName: jest.fn(),
  } as unknown as Mocked<ProviderChainsService>;

  const guard = new ApiKeyGuard(
    serverApiKeysService as unknown as ServerApiKeysService,
    providersService as unknown as ProvidersService,
    providerChainsService as unknown as ProviderChainsService,
  );

  return { guard, serverApiKeysService, providersService, providerChainsService };
}

describe('ApiKeyGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateApiKeyHeader', () => {
    it('throws UnauthorizedException when no x-api-key header is provided', async () => {
      const { guard } = buildGuard();

      await expect(
        guard.validateApiKeyHeader(undefined as unknown as string),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('throws BadRequestException when both providerId and providerChain are set', async () => {
      const { guard } = buildGuard();

      await expect(guard.validateApiKeyHeader('hdr', 1, 'someChain')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('returns true when bcrypt-comparison matches one stored API key for the resolved application', async () => {
      const { guard, providersService, serverApiKeysService } = buildGuard();
      providersService.getById.mockResolvedValue({
        providerId: 10,
        applicationId: 100,
        isEnabled: IsEnabledStatus.TRUE,
        name: 'P10',
      });
      serverApiKeysService.findByRelatedApplicationId.mockResolvedValue([
        { apiKey: 'hash1' },
        { apiKey: 'hash2' },
      ]);
      (compareApiKeys as jest.Mock).mockResolvedValueOnce(false).mockResolvedValueOnce(true);

      const result = await guard.validateApiKeyHeader('raw-key', 10);

      expect(result).toBe(true);
      expect(compareApiKeys).toHaveBeenCalledTimes(2);
      expect(serverApiKeysService.findByRelatedApplicationId).toHaveBeenCalledWith(100);
    });

    it('returns false when no stored hash matches the provided key', async () => {
      const { guard, providersService, serverApiKeysService } = buildGuard();
      providersService.getById.mockResolvedValue({
        providerId: 10,
        applicationId: 100,
        isEnabled: IsEnabledStatus.TRUE,
      });
      serverApiKeysService.findByRelatedApplicationId.mockResolvedValue([{ apiKey: 'h' }]);
      (compareApiKeys as jest.Mock).mockResolvedValue(false);

      const result = await guard.validateApiKeyHeader('raw-key', 10);

      expect(result).toBe(false);
    });

    it('returns false when the application has no api keys at all', async () => {
      const { guard, providersService, serverApiKeysService } = buildGuard();
      providersService.getById.mockResolvedValue({
        providerId: 10,
        applicationId: 100,
        isEnabled: IsEnabledStatus.TRUE,
      });
      serverApiKeysService.findByRelatedApplicationId.mockResolvedValue([]);

      const result = await guard.validateApiKeyHeader('raw-key', 10);

      expect(result).toBe(false);
      expect(compareApiKeys).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when the providerId does not resolve to a provider', async () => {
      const { guard, providersService } = buildGuard();
      providersService.getById.mockResolvedValue(null);

      await expect(guard.validateApiKeyHeader('raw-key', 999)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('throws BadRequestException when the provider is disabled', async () => {
      const { guard, providersService } = buildGuard();
      providersService.getById.mockResolvedValue({
        providerId: 10,
        applicationId: 100,
        isEnabled: IsEnabledStatus.FALSE,
        name: 'Disabled',
      });

      await expect(guard.validateApiKeyHeader('raw-key', 10)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('resolves application via providerChain when only chain name is provided', async () => {
      const { guard, providerChainsService, serverApiKeysService } = buildGuard();
      providerChainsService.getByProviderChainName.mockResolvedValue({
        chainId: 7,
        applicationId: 100,
      });
      serverApiKeysService.findByRelatedApplicationId.mockResolvedValue([{ apiKey: 'h' }]);
      (compareApiKeys as jest.Mock).mockResolvedValue(true);

      const result = await guard.validateApiKeyHeader('raw-key', null, 'fallback');

      expect(providerChainsService.getByProviderChainName).toHaveBeenCalledWith('fallback');
      expect(result).toBe(true);
    });

    it('throws BadRequestException when neither providerId nor providerChain is set', async () => {
      const { guard } = buildGuard();

      await expect(guard.validateApiKeyHeader('raw-key', null, null)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });
});
