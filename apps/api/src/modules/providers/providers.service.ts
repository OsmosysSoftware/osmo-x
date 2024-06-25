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

  async createProvider(
    providerInput: CreateProviderInput,
    authorizationHeader: Request,
  ): Promise<Provider> {
    const isAdmin = await this.applicationsService.checkAdminUser(authorizationHeader);

    if (!isAdmin) {
      throw new Error('Access Denied. Not an ADMIN.');
    }

    const userExists = await this.usersService.findByUserId(providerInput.userId);
    const applicationExists = await this.applicationsService.findById(providerInput.applicationId);
    const channelExists = providerInput.channelType >= 1 && providerInput.channelType <= 8;

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
    const configEntity = await this.providerRepository.findOne({
      where: { providerId, status: Status.ACTIVE },
    });

    if (configEntity) {
      return configEntity.configuration as unknown as Record<string, unknown>;
    }

    return null;
  }

  async getAllProviders(
    options: QueryOptionsDto,
    authorizationHeader: Request,
  ): Promise<ProviderResponse> {
    const isAdmin = await this.applicationsService.checkAdminUser(authorizationHeader);

    if (!isAdmin) {
      throw new Error('Access Denied. Not an ADMIN.');
    }

    const baseConditions = [];
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
