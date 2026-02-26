import { BadRequestException, forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Provider } from './entities/provider.entity';
import { Status } from 'src/common/constants/database';
import { CreateProviderInput } from './dto/create-provider.input';
import { UpdateProviderInput } from './dto/update-provider.input';
import { UsersService } from '../users/users.service';
import { ApplicationsService } from '../applications/applications.service';
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
  ) {
    super(providerRepository);
  }

  async getById(providerId: number): Promise<Provider | null> {
    if (providerId === undefined || providerId === null) {
      return null;
    }

    return this.providerRepository.findOne({ where: { providerId, status: Status.ACTIVE } });
  }

  async createProvider(providerInput: CreateProviderInput): Promise<Provider> {
    const userExists = await this.usersService.findByUserId(providerInput.userId);
    const applicationExists = await this.applicationsService.findById(providerInput.applicationId);
    const channelExists = Object.values(ChannelType).includes(providerInput.channelType);

    if (!userExists) {
      throw new Error('Invalid userId');
    }

    if (!applicationExists) {
      throw new Error('Invalid applicationId.');
    }

    if (!channelExists) {
      throw new Error('Invalid channelType');
    }

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
      configuration: provider.configuration,
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
      throw new BadRequestException('Provider not found');
    }

    const app = await this.applicationsService.findById(provider.applicationId);

    if (!app || app.organizationId !== organizationId) {
      throw new BadRequestException('Provider not found');
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
  ): Promise<ProviderResponseDto> {
    const app = await this.applicationsService.findById(providerInput.applicationId);

    if (!app || app.organizationId !== organizationId) {
      throw new BadRequestException('Application not found');
    }

    const provider = await this.createProvider(providerInput);
    provider.createdBy = providerInput.userId;
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
      throw new BadRequestException('Provider not found');
    }

    const app = await this.applicationsService.findById(provider.applicationId);

    if (!app || app.organizationId !== organizationId) {
      throw new BadRequestException('Provider not found');
    }

    if (input.name !== undefined) {
      provider.name = input.name;
    }

    if (input.configuration !== undefined) {
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
