import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MasterProvider } from './entities/master-provider.entity';
import { Repository } from 'typeorm';
import { Status } from 'src/common/constants/database';

@Injectable()
export class MasterProvidersService {
  constructor(
    @InjectRepository(MasterProvider)
    private readonly masterProviderRepository: Repository<MasterProvider>,
  ) {}

  async getById(masterId: number): Promise<MasterProvider | null> {
    if (masterId === undefined || masterId === null) {
      return null;
    }

    return this.masterProviderRepository.findOne({
      where: { masterId, status: Status.ACTIVE },
    });
  }
}
