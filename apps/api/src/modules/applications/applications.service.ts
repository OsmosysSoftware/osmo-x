import { Injectable } from '@nestjs/common';
import { Application } from './entities/application.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectRepository(Application)
    private readonly applicationsRepository: Repository<Application>,
  ) {}

  async findById(applicationId: number): Promise<Application | undefined> {
    return this.applicationsRepository.findOne({ where: { applicationId } });
  }
}
