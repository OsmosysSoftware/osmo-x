import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Provider } from './entities/provider.entity';
import { Status } from 'src/common/constants/database';
import { CreateProviderInput } from './dto/create-provider.input';
import { UsersService } from '../users/users.service';
import { ApplicationsService } from '../applications/applications.service';
import { QueryOptionsDto } from 'src/common/graphql/dtos/query-options.dto';
import { ProviderResponse } from './dto/provider-response.dto';
import { CoreService } from 'src/common/graphql/services/core.service';
import { ChannelType } from 'src/common/constants/notifications';

@Injectable()
export class ProvidersService extends CoreService<Provider> {
  protected readonly logger = new Logger(ProvidersService.name);
  constructor(
    @InjectRepository(Provider)
    private readonly providerRepository: Repository<Provider>,
    private readonly applicationsService: ApplicationsService,
    private readonly usersService: UsersService,
  ) {
    super(providerRepository);
  }

  async getById(providerId: number): Promise<Provider | undefined> {
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

  async getAllProviders(options: QueryOptionsDto): Promise<ProviderResponse> {
    const baseConditions = [{ field: 'status', value: Status.ACTIVE }];
    const searchableFields = ['name'];

    const { items, total } = await super.findAll(
      options,
      'provider',
      searchableFields,
      baseConditions,
    );
    return new ProviderResponse(items, total, options.offset, options.limit);
  }
}
