import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from './entities/organization.entity';
import { Status } from 'src/common/constants/database';
import { OrganizationResponseDto } from './dto/organization-response.dto';

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

  private mapToDto(org: Organization): OrganizationResponseDto {
    return {
      organizationId: org.organizationId,
      name: org.name,
      slug: org.slug,
      status: org.status,
      createdBy: org.createdBy,
      updatedBy: org.updatedBy,
      createdOn: org.createdOn,
      updatedOn: org.updatedOn,
    };
  }

  async findAllAsDto(): Promise<OrganizationResponseDto[]> {
    const orgs = await this.findAll();

    return orgs.map((org) => this.mapToDto(org));
  }
}
