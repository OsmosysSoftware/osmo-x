import { Injectable } from '@nestjs/common';
import { CreateServerapikeyInput } from './dto/create-serverapikey.input';
import { UpdateServerapikeyInput } from './dto/update-serverapikey.input';

@Injectable()
export class ServerapikeysService {
  create(createServerapikeyInput: CreateServerapikeyInput) {
    return 'This action adds a new serverapikey';
  }

  findAll() {
    return `This action returns all serverapikeys`;
  }

  findOne(id: number) {
    return `This action returns a #${id} serverapikey`;
  }

  update(id: number, updateServerapikeyInput: UpdateServerapikeyInput) {
    return `This action updates a #${id} serverapikey`;
  }

  remove(id: number) {
    return `This action removes a #${id} serverapikey`;
  }
}
