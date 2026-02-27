import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm/repository/Repository';
import { ServerApiKey } from './entities/server-api-key.entity';
import { Status } from 'src/common/constants/database';
import { hashApiKey } from 'src/common/utils/bcrypt';
import * as crypto from 'crypto';
import { ServerApiKeyResponseDto } from './dto/server-api-key-response.dto';
import { ApplicationsService } from '../applications/applications.service';

@Injectable()
export class ServerApiKeysService {
  constructor(
    @InjectRepository(ServerApiKey)
    private readonly serverApiKeyRepository: Repository<ServerApiKey>,
    private readonly applicationsService: ApplicationsService,
  ) {}

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

  private mapToDto(key: ServerApiKey): ServerApiKeyResponseDto {
    return {
      apiKeyId: key.apiKeyId,
      maskedApiKey: key.maskedApiKey,
      applicationId: key.applicationId,
      status: key.status,
      createdBy: key.createdBy,
      updatedBy: key.updatedBy,
      createdOn: key.createdOn,
      updatedOn: key.updatedOn,
    };
  }

  async findByRelatedApplicationIdAsDto(
    applicationId: number,
    organizationId: number,
  ): Promise<ServerApiKeyResponseDto[]> {
    const app = await this.applicationsService.findById(applicationId);

    if (!app || app.organizationId !== organizationId) {
      throw new BadRequestException('Application not found');
    }

    const keys = await this.findByRelatedApplicationId(applicationId);

    return keys.map((key) => this.mapToDto(key));
  }

  async revokeApiKeyByOrg(apiKeyId: number, organizationId: number): Promise<boolean> {
    const key = await this.serverApiKeyRepository.findOne({
      where: { apiKeyId, status: Status.ACTIVE },
    });

    if (!key) {
      throw new BadRequestException('API key not found');
    }

    const app = await this.applicationsService.findById(key.applicationId);

    if (!app || app.organizationId !== organizationId) {
      throw new BadRequestException('API key not found');
    }

    key.status = Status.INACTIVE;
    await this.serverApiKeyRepository.save(key);

    return true;
  }

  async generateApiKeyByOrg(applicationId: number, organizationId: number): Promise<string> {
    const app = await this.applicationsService.findById(applicationId);

    if (!app || app.organizationId !== organizationId) {
      throw new BadRequestException('Application not found');
    }

    return this.generateApiKey(applicationId);
  }
}
