import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from './entities/organization.entity';
import { Status } from 'src/common/constants/database';
import { OrganizationResponseDto } from './dto/organization-response.dto';
import { CreateOrganizationInput } from './dto/create-organization.input';
import { UpdateOrganizationInput } from './dto/update-organization.input';

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

  async createAsDto(
    input: CreateOrganizationInput,
    createdByUserId: number,
  ): Promise<OrganizationResponseDto> {
    const existing = await this.organizationRepository.findOne({
      where: { slug: input.slug },
    });

    if (existing) {
      throw new BadRequestException('Organization slug already exists');
    }

    const org = this.organizationRepository.create({
      name: input.name,
      slug: input.slug,
      createdBy: createdByUserId,
      updatedBy: createdByUserId,
    });

    const saved = await this.organizationRepository.save(org);

    return this.mapToDto(saved);
  }

  async updateAsDto(
    input: UpdateOrganizationInput,
    updatedByUserId: number,
  ): Promise<OrganizationResponseDto> {
    const org = await this.organizationRepository.findOne({
      where: { organizationId: input.organizationId, status: Status.ACTIVE },
    });

    if (!org) {
      throw new BadRequestException('Organization not found');
    }

    if (input.slug !== undefined && input.slug !== org.slug) {
      const existing = await this.organizationRepository.findOne({
        where: { slug: input.slug },
      });

      if (existing && existing.organizationId !== input.organizationId) {
        throw new BadRequestException('Organization slug already exists');
      }

      org.slug = input.slug;
    }

    if (input.name !== undefined) {
      org.name = input.name;
    }

    org.updatedBy = updatedByUserId;
    const saved = await this.organizationRepository.save(org);

    return this.mapToDto(saved);
  }

  async softDeleteAsDto(organizationId: number): Promise<boolean> {
    const org = await this.organizationRepository.findOne({
      where: { organizationId, status: Status.ACTIVE },
    });

    if (!org) {
      throw new BadRequestException('Organization not found');
    }

    org.status = Status.INACTIVE;
    await this.organizationRepository.save(org);

    return true;
  }
}
