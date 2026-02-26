import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from './entities/organization.entity';
import { Status } from 'src/common/constants/database';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
  ) {}

  async findById(organizationId: number): Promise<Organization | undefined> {
    return this.organizationRepository.findOne({
      where: { organizationId, status: Status.ACTIVE },
    });
  }

  async findBySlug(slug: string): Promise<Organization | undefined> {
    return this.organizationRepository.findOne({
      where: { slug, status: Status.ACTIVE },
    });
  }

  async findAll(): Promise<Organization[]> {
    return this.organizationRepository.find({
      where: { status: Status.ACTIVE },
    });
  }
}
