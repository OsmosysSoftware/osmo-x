import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm/repository/Repository';
import { ServerApiKey } from './entities/server-api-key.entity';

@Injectable()
export class ServerApiKeysService {
  constructor(
    @InjectRepository(ServerApiKey)
    private readonly serverApiKeyRepository: Repository<ServerApiKey>,
  ) {}

  async findByServerApiKey(apiKey: string): Promise<ServerApiKey | undefined> {
    return this.serverApiKeyRepository.findOne({ where: { apiKey } });
  }
}
