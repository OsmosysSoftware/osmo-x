import { Injectable } from '@nestjs/common';
import { Application } from './entities/application.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateApplicationInput } from './dto/create-application.input';

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectRepository(Application)
    private readonly applicationsRepository: Repository<Application>,
  ) {}

  async findById(applicationId: number): Promise<Application | undefined> {
    return this.applicationsRepository.findOne({ where: { applicationId } });
  }

  async findByUserId(userId: number): Promise<Application | undefined> {
    return this.applicationsRepository.findOne({ where: { userId } });
  }

  async createApplication(applicationInput: CreateApplicationInput): Promise<Application> {
    const application = this.applicationsRepository.create(applicationInput);
    return this.applicationsRepository.save(application);
  }
}
