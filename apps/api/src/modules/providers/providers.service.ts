import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Provider } from './entities/provider.entity';

@Injectable()
export class ProvidersService {
  constructor(
    @InjectRepository(Provider)
    private readonly providerRepository: Repository<Provider>,
  ) {}

  async getById(providerId: number): Promise<Provider | undefined> {
    return this.providerRepository.findOne({ where: { providerId } });
  }

  async getConfigById(providerId: number): Promise<Record<string, unknown> | null> {
    const configEntity = await this.providerRepository.findOne({ where: { providerId } });

    if (configEntity) {
      return configEntity.configuration as unknown as Record<string, unknown>;
    }

    return null;
  }
}
