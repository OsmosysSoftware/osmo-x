import { Injectable } from '@nestjs/common';
import { CreateMasterProviderInput } from './dto/create-master_provider.input';
import { UpdateMasterProviderInput } from './dto/update-master_provider.input';

@Injectable()
export class MasterProvidersService {
  create(createMasterProviderInput: CreateMasterProviderInput) {
    return 'This action adds a new masterProvider';
  }

  findAll() {
    return `This action returns all masterProviders`;
  }

  findOne(id: number) {
    return `This action returns a #${id} masterProvider`;
  }

  update(id: number, updateMasterProviderInput: UpdateMasterProviderInput) {
    return `This action updates a #${id} masterProvider`;
  }

  remove(id: number) {
    return `This action removes a #${id} masterProvider`;
  }
}
