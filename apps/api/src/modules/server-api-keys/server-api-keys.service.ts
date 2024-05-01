import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm/repository/Repository';
import { ServerApiKey } from './entities/server-api-key.entity';
import { Status } from 'src/common/constants/database';

@Injectable()
export class ServerApiKeysService {
  constructor(
    @InjectRepository(ServerApiKey)
    private readonly serverApiKeyRepository: Repository<ServerApiKey>,
  ) {}

  async findByServerApiKey(apiKey: string): Promise<ServerApiKey | undefined> {
    return this.serverApiKeyRepository.findOne({ where: { apiKey, status: Status.ACTIVE } });
  }

  async findByRelatedApplicationId(applicationId: number): Promise<ServerApiKey | undefined> {
    return this.serverApiKeyRepository.findOne({ where: { applicationId, status: Status.ACTIVE } });
  }

  async findAllWithStatusOne(): Promise<ServerApiKey[]> {
    return this.serverApiKeyRepository.find({ where: { status: Status.ACTIVE } });
  }
}
