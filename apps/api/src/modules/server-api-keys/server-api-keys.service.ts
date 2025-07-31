import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm/repository/Repository';
import { ServerApiKey } from './entities/server-api-key.entity';
import { Status } from 'src/common/constants/database';
import { QueryOptionsDto } from 'src/common/graphql/dtos/query-options.dto';
import { CoreService } from 'src/common/graphql/services/core.service';
import { hashApiKey } from 'src/common/utils/bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class ServerApiKeysService extends CoreService<ServerApiKey> {
  constructor(
    @InjectRepository(ServerApiKey)
    private readonly serverApiKeyRepository: Repository<ServerApiKey>,
  ) {
    super(serverApiKeyRepository);
  }

  async findByServerApiKey(apiKey: string): Promise<ServerApiKey | undefined> {
    return this.serverApiKeyRepository.findOne({ where: { apiKey, status: Status.ACTIVE } });
  }

  async findByRelatedApplicationId(applicationId: number): Promise<ServerApiKey[]> {
    return this.serverApiKeyRepository.find({
      where: {
        applicationId,
        status: Status.ACTIVE,
      },
    });
  }

  async generateApiKey(applicationId: number): Promise<string> {
    const originalApiKey = crypto.randomBytes(32).toString('hex');
    const encryptedApiKey = await hashApiKey(originalApiKey);
    const maskedApiKey = `${originalApiKey.slice(0, 4)}****${originalApiKey.slice(-4)}`;

    const serverApiKey = this.serverApiKeyRepository.create({
      apiKey: encryptedApiKey,
      maskedApiKey,
      applicationId,
    });

    await this.serverApiKeyRepository.save(serverApiKey);

    return originalApiKey;
  }

  async getAllServerApiKeys(options: QueryOptionsDto): Promise<ServerApiKey[]> {
    const baseConditions = [{ field: 'status', value: Status.ACTIVE }];
    const searchableFields = [];

    const { items } = await super.findAll(
      options,
      'serverApiKeys',
      searchableFields,
      baseConditions,
    );
    return items;
  }
}
