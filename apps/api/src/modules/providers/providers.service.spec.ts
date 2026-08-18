import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProvidersService } from './providers.service';
import { Provider } from './entities/provider.entity';
import { ApplicationsService } from '../applications/applications.service';
import { UsersService } from '../users/users.service';
import { MasterProvidersService } from '../master-providers/master-providers.service';
import { WebhookService } from '../webhook/webhook.service';
import { Status } from 'src/common/constants/database';

describe('ProvidersService', () => {
  let service: ProvidersService;
  let providerRepository: { findOne: jest.Mock; save: jest.Mock };
  let applicationsService: { findById: jest.Mock };
  let webhookService: { deactivateWebhooksForProvider: jest.Mock };

  const provider: Partial<Provider> = {
    providerId: 10,
    applicationId: 1,
    status: Status.ACTIVE,
  };

  beforeEach(async () => {
    providerRepository = {
      findOne: jest.fn().mockResolvedValue({ ...provider }),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
    };
    applicationsService = {
      findById: jest.fn().mockResolvedValue({ applicationId: 1, organizationId: 5 }),
    };
    webhookService = {
      deactivateWebhooksForProvider: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProvidersService,
        { provide: getRepositoryToken(Provider), useValue: providerRepository },
        { provide: ApplicationsService, useValue: applicationsService },
        { provide: UsersService, useValue: {} },
        { provide: MasterProvidersService, useValue: {} },
        { provide: WebhookService, useValue: webhookService },
      ],
    }).compile();

    service = module.get<ProvidersService>(ProvidersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('softDeleteProviderAsDto', () => {
    it('marks the provider inactive and deactivates its webhook', async () => {
      const result = await service.softDeleteProviderAsDto(10, 5);

      expect(result).toBe(true);
      expect(providerRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ providerId: 10, status: Status.INACTIVE }),
      );
      expect(webhookService.deactivateWebhooksForProvider).toHaveBeenCalledWith(10);
    });

    it('throws and does not touch the webhook when the provider belongs to a different org', async () => {
      applicationsService.findById.mockResolvedValueOnce({ applicationId: 1, organizationId: 99 });

      await expect(service.softDeleteProviderAsDto(10, 5)).rejects.toThrow();

      expect(providerRepository.save).not.toHaveBeenCalled();
      expect(webhookService.deactivateWebhooksForProvider).not.toHaveBeenCalled();
    });

    it('throws when the provider does not exist', async () => {
      providerRepository.findOne.mockResolvedValueOnce(null);

      await expect(service.softDeleteProviderAsDto(999, 5)).rejects.toThrow();

      expect(webhookService.deactivateWebhooksForProvider).not.toHaveBeenCalled();
    });
  });
});
