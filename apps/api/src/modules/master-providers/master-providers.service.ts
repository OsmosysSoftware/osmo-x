import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MasterProvider } from './entities/master-provider.entity';
import { Repository } from 'typeorm';
import { Status } from 'src/common/constants/database';
import { MasterProviderResponseDto } from './dto/master-provider-response.dto';

@Injectable()
export class MasterProvidersService {
  constructor(
    @InjectRepository(MasterProvider)
    private readonly masterProviderRepository: Repository<MasterProvider>,
  ) {}

  async findAll(): Promise<MasterProvider[]> {
    return this.masterProviderRepository.find({
      where: { status: Status.ACTIVE },
    });
  }

  async getById(masterId: number): Promise<MasterProvider | null> {
    if (masterId === undefined || masterId === null) {
      return null;
    }

    return this.masterProviderRepository.findOne({
      where: { masterId, status: Status.ACTIVE },
    });
  }

  private mapToDto(mp: MasterProvider): MasterProviderResponseDto {
    return {
      masterId: mp.masterId,
      name: mp.name,
      providerType: mp.providerType,
      configuration: mp.configuration,
      status: mp.status,
      createdBy: mp.createdBy,
      updatedBy: mp.updatedBy,
      createdOn: mp.createdOn,
      updatedOn: mp.updatedOn,
    };
  }

  async findAllAsDto(): Promise<MasterProviderResponseDto[]> {
    const providers = await this.findAll();

    return providers.map((mp) => this.mapToDto(mp));
  }
}
