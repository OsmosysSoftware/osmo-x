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

  async getConfigById(providerId: number): Promise<Record<string, unknown> | null> {
    const configEntity = await this.providerRepository.findOne({ where: { providerId } });

    if (configEntity) {
      return JSON.parse(configEntity.configuration);
    }

    return null;
  }
}
