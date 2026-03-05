import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { NotFoundException, ValidationException } from 'src/common/exceptions/app.exception';
import { ErrorCodes } from 'src/common/constants/error-codes';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Provider } from './entities/provider.entity';
import { Status } from 'src/common/constants/database';
import { CreateProviderInput } from './dto/create-provider.input';
import { UpdateProviderInput } from './dto/update-provider.input';
import { UsersService } from '../users/users.service';
import { ApplicationsService } from '../applications/applications.service';
import { MasterProvidersService } from '../master-providers/master-providers.service';
import { QueryOptionsDto } from 'src/common/graphql/dtos/query-options.dto';
import { ProviderListResponse } from './dto/provider-list.dto';
import { CoreService } from 'src/common/graphql/services/core.service';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { PaginationMeta, PaginationHelper } from 'src/common/utils/pagination.helper';
import { ChannelType } from 'src/common/constants/notifications';
import { ProviderResponseDto } from './dto/provider-response.dto';

@Injectable()
export class ProvidersService extends CoreService<Provider> {
  protected readonly logger = new Logger(ProvidersService.name);
  constructor(
    @InjectRepository(Provider)
    private readonly providerRepository: Repository<Provider>,
    @Inject(forwardRef(() => ApplicationsService))
    private readonly applicationsService: ApplicationsService,
    private readonly usersService: UsersService,
    private readonly masterProvidersService: MasterProvidersService,
  ) {
    super(providerRepository);
  }

  async getById(providerId: number): Promise<Provider | null> {
    if (providerId === undefined || providerId === null) {
      return null;
    }

    return this.providerRepository.findOne({ where: { providerId, status: Status.ACTIVE } });
  }

  async findByApplicationIds(appIds: number[]): Promise<Provider[]> {
    if (appIds.length === 0) {
      return [];
    }

    return this.providerRepository.find({
      where: { applicationId: In(appIds), status: Status.ACTIVE },
      select: ['providerId'],
    });
  }

  private async validateConfiguration(
    channelType: number,
    configuration: Record<string, unknown>,
  ): Promise<void> {
    const masterProvider = await this.masterProvidersService.getById(channelType);

    if (!masterProvider) {
      throw new ValidationException(
        ErrorCodes.PROVIDER_CONFIGURATION_INVALID,
        `No master provider found for channel type ${channelType}`,
      );
    }

    const schema = masterProvider.configuration as unknown as Record<
      string,
      { label: string; id: string; pattern: string; type: string }
    >;
    const requiredKeys = Object.keys(schema);
    const providedKeys = Object.keys(configuration);

    const missingKeys = requiredKeys.filter((key) => !providedKeys.includes(key));

    if (missingKeys.length > 0) {
      const missingLabels = missingKeys.map((key) => schema[key].label);

      throw new ValidationException(
        ErrorCodes.PROVIDER_CONFIGURATION_INVALID,
        `Missing required configuration fields: ${missingLabels.join(', ')}`,
      );
    }
  }

  async createProvider(providerInput: CreateProviderInput): Promise<Provider> {
    const userExists = await this.usersService.findByUserId(providerInput.userId);
    const applicationExists = await this.applicationsService.findById(providerInput.applicationId);
    const channelExists = Object.values(ChannelType).includes(providerInput.channelType);

    if (!userExists) {
      throw new ValidationException(ErrorCodes.VALIDATION_FAILED, 'Invalid userId');
    }

    if (!applicationExists) {
      throw new ValidationException(ErrorCodes.VALIDATION_FAILED, 'Invalid applicationId');
    }

    if (!channelExists) {
      throw new ValidationException(ErrorCodes.VALIDATION_FAILED, 'Invalid channelType');
    }

    await this.validateConfiguration(
      providerInput.channelType,
      providerInput.configuration as unknown as Record<string, unknown>,
    );

    const provider = this.providerRepository.create(providerInput);
    return this.providerRepository.save(provider);
  }

  async getConfigById(providerId: number): Promise<Record<string, unknown> | null> {
    this.logger.debug(`Fetching config for provider with id: ${providerId}`);
    const configEntity = await this.providerRepository.findOne({
      where: { providerId, status: Status.ACTIVE },
    });

    if (configEntity) {
      this.logger.debug('config entry fetched successfully');
      return configEntity.configuration as unknown as Record<string, unknown>;
    }

    return null;
  }

  private mapToDto(provider: Provider): ProviderResponseDto {
    return {
      providerId: provider.providerId,
      name: provider.name,
      channelType: provider.channelType,
      isEnabled: provider.isEnabled,
      hasConfiguration: !!provider.configuration,
      applicationId: provider.applicationId,
      userId: provider.userId,
      status: provider.status,
      createdBy: provider.createdBy,
      updatedBy: provider.updatedBy,
      createdOn: provider.createdOn,
      updatedOn: provider.updatedOn,
    };
  }

  async findByIdAsDto(providerId: number, organizationId: number): Promise<ProviderResponseDto> {
    const provider = await this.getById(providerId);

    if (!provider) {
      throw new NotFoundException(ErrorCodes.PROVIDER_NOT_FOUND, 'Provider not found');
    }

    const app = await this.applicationsService.findById(provider.applicationId);

    if (!app || app.organizationId !== organizationId) {
      throw new NotFoundException(ErrorCodes.PROVIDER_NOT_FOUND, 'Provider not found');
    }

    return this.mapToDto(provider);
  }

  async getAllProvidersAsDto(
    query: PaginationQueryDto,
    organizationId: number,
  ): Promise<{ items: ProviderResponseDto[]; meta: PaginationMeta }> {
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
    const searchableFields = ['name'];
    const { items, meta } = await super.findAllPaginated(
      query,
      'provider',
      searchableFields,
      baseConditions,
    );

    return {
      items: items.map((provider) => this.mapToDto(provider)),
      meta,
    };
  }

  async createProviderAsDto(
    providerInput: CreateProviderInput,
    organizationId: number,
    userId?: number,
  ): Promise<ProviderResponseDto> {
    const app = await this.applicationsService.findById(providerInput.applicationId);

    if (!app || app.organizationId !== organizationId) {
      throw new NotFoundException(ErrorCodes.APP_NOT_FOUND, 'Application not found');
    }

    const effectiveUserId = userId ?? providerInput.userId;
    providerInput.userId = effectiveUserId;
    const provider = await this.createProvider(providerInput);
    provider.createdBy = effectiveUserId;
    const saved = await this.providerRepository.save(provider);

    return this.mapToDto(saved);
  }

  async updateProviderAsDto(
    input: UpdateProviderInput,
    organizationId: number,
    userId?: number,
  ): Promise<ProviderResponseDto> {
    const provider = await this.getById(input.providerId);

    if (!provider) {
      throw new NotFoundException(ErrorCodes.PROVIDER_NOT_FOUND, 'Provider not found');
    }

    const app = await this.applicationsService.findById(provider.applicationId);

    if (!app || app.organizationId !== organizationId) {
      throw new NotFoundException(ErrorCodes.PROVIDER_NOT_FOUND, 'Provider not found');
    }

    if (input.name !== undefined) {
      provider.name = input.name;
    }

    if (input.configuration !== undefined) {
      await this.validateConfiguration(
        provider.channelType,
        input.configuration as unknown as Record<string, unknown>,
      );
      provider.configuration = input.configuration;
    }

    if (input.isEnabled !== undefined) {
      provider.isEnabled = input.isEnabled;
    }

    if (userId !== undefined) {
      provider.updatedBy = userId;
    }

    const saved = await this.providerRepository.save(provider);

    return this.mapToDto(saved);
  }

  async softDeleteProviderAsDto(providerId: number, organizationId: number): Promise<boolean> {
    const provider = await this.getById(providerId);

    if (!provider) {
      throw new NotFoundException(ErrorCodes.PROVIDER_NOT_FOUND, 'Provider not found');
    }

    const app = await this.applicationsService.findById(provider.applicationId);

    if (!app || app.organizationId !== organizationId) {
      throw new NotFoundException(ErrorCodes.PROVIDER_NOT_FOUND, 'Provider not found');
    }

    provider.status = Status.INACTIVE;
    await this.providerRepository.save(provider);

    return true;
  }

  async getAllProviders(options: QueryOptionsDto): Promise<ProviderListResponse> {
    const baseConditions = [{ field: 'status', value: Status.ACTIVE }];
    const searchableFields = ['name'];

    const { items, total } = await super.findAll(
      options,
      'provider',
      searchableFields,
      baseConditions,
    );
    return new ProviderListResponse(items, total, options.offset, options.limit);
  }
}
