import { forwardRef, Inject, Injectable } from '@nestjs/common';
import {
  AuthException,
  NotFoundException,
  ValidationException,
} from 'src/common/exceptions/app.exception';
import { ErrorCodes } from 'src/common/constants/error-codes';
import { Application } from './entities/application.entity';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateApplicationInput } from './dto/create-application.input';
import { UsersService } from '../users/users.service';
import { Status } from 'src/common/constants/database';
import { ApplicationListResponse } from './dto/application-list.dto';
import { QueryOptionsDto } from 'src/common/graphql/dtos/query-options.dto';
import { CoreService } from 'src/common/graphql/services/core.service';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { PaginationMeta } from 'src/common/utils/pagination.helper';
import { User } from '../users/entities/user.entity';
import { UpdateApplicationInput } from './dto/update-application.input';
import { ProvidersService } from '../providers/providers.service';
import { ConfigService } from '@nestjs/config';
import { ApplicationResponseDto } from './dto/application-response.dto';

@Injectable()
export class ApplicationsService extends CoreService<Application> {
  constructor(
    @InjectRepository(Application)
    private readonly applicationsRepository: Repository<Application>,
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => ProvidersService))
    private readonly providersService: ProvidersService,
    private readonly configService: ConfigService,
    private dataSource: DataSource,
  ) {
    super(applicationsRepository);
  }

  async findById(applicationId: number): Promise<Application | undefined> {
    return this.applicationsRepository.findOne({ where: { applicationId, status: Status.ACTIVE } });
  }

  async findByUserId(userId: number): Promise<Application | undefined> {
    return this.applicationsRepository.findOne({ where: { userId, status: Status.ACTIVE } });
  }

  async getApplicationIdsByOrganization(organizationId: number): Promise<number[]> {
    const apps = await this.applicationsRepository.find({
      where: { organizationId, status: Status.ACTIVE },
      select: ['applicationId'],
    });

    return apps.map((app) => app.applicationId);
  }

  async createApplication(
    applicationInput: CreateApplicationInput,
    requestUserId: number,
    organizationId: number,
  ): Promise<Application> {
    const userEntryFromContext = await this.getUserEntryFromContext(requestUserId);

    const newApplicationObject = new Application({
      name: applicationInput.name,
      userId: userEntryFromContext.userId,
    });

    newApplicationObject.organizationId = organizationId;
    newApplicationObject.createdBy = requestUserId;

    if (
      applicationInput.testModeEnabled !== null &&
      applicationInput.testModeEnabled !== undefined
    ) {
      newApplicationObject.testModeEnabled = applicationInput.testModeEnabled;
    }

    if (
      applicationInput.whitelistRecipients !== null &&
      applicationInput.whitelistRecipients !== undefined
    ) {
      const verified = await this.verifyWhitelist(applicationInput.whitelistRecipients);

      if (verified) {
        newApplicationObject.whitelistRecipients = applicationInput.whitelistRecipients;
      } else {
        throw new ValidationException(
          ErrorCodes.VALIDATION_FAILED,
          'Whitelist verification failed',
        );
      }
    }

    const application = this.applicationsRepository.create(newApplicationObject);
    return this.applicationsRepository.save(application);
  }

  async getUserEntryFromContext(requestUserId: number): Promise<User> {
    try {
      // Find the related user entry using the user ID from the token
      const userEntry = await this.usersService.findByUserId(requestUserId);

      if (!userEntry) {
        throw new AuthException(ErrorCodes.AUTH_UNAUTHORIZED, 'User not found');
      }

      return userEntry;
    } catch (error) {
      throw error;
    }
  }

  async getAllApplications(options: QueryOptionsDto): Promise<ApplicationListResponse> {
    const baseConditions = [{ field: 'status', value: Status.ACTIVE }];
    const searchableFields = ['name'];

    const { items, total } = await super.findAll(
      options,
      'application',
      searchableFields,
      baseConditions,
    );
    return new ApplicationListResponse(items, total, options.offset, options.limit);
  }

  async updateApplication(updateApplicationInput: UpdateApplicationInput): Promise<Application> {
    if (!(await this.findById(updateApplicationInput.applicationId))) {
      throw new NotFoundException(ErrorCodes.APP_NOT_FOUND, 'Application not found');
    }

    this.logger.log('Creating queryRunner and starting transaction');
    const queryRunner: QueryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const application = await this.findById(updateApplicationInput.applicationId);

      if (
        updateApplicationInput.whitelistRecipients !== null &&
        updateApplicationInput.whitelistRecipients !== undefined &&
        JSON.stringify(updateApplicationInput.whitelistRecipients) !==
          JSON.stringify(application.whitelistRecipients)
      ) {
        const verified = await this.verifyWhitelist(
          updateApplicationInput.whitelistRecipients,
          updateApplicationInput.applicationId,
        );

        if (verified) {
          application.whitelistRecipients = updateApplicationInput.whitelistRecipients;
        } else {
          throw new ValidationException(
            ErrorCodes.VALIDATION_FAILED,
            'Whitelist verification failed',
          );
        }
      }

      if (
        updateApplicationInput.name !== null &&
        updateApplicationInput.name !== undefined &&
        updateApplicationInput.name !== application.name
      ) {
        application.name = updateApplicationInput.name;
      }

      if (
        updateApplicationInput.testModeEnabled !== null &&
        updateApplicationInput.testModeEnabled !== undefined &&
        updateApplicationInput.testModeEnabled !== application.testModeEnabled
      ) {
        application.testModeEnabled = updateApplicationInput.testModeEnabled;
      }

      await queryRunner.manager.save(application);
      await queryRunner.commitTransaction();
      return await this.applicationsRepository.findOne({
        where: { applicationId: updateApplicationInput.applicationId },
      });
    } catch (error) {
      this.logger.error('Error while updating application. Rolling back transaction');
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findByIdAsDto(
    applicationId: number,
    organizationId: number,
  ): Promise<ApplicationResponseDto> {
    const app = await this.findById(applicationId);

    if (!app || app.organizationId !== organizationId) {
      throw new NotFoundException(ErrorCodes.APP_NOT_FOUND, 'Application not found');
    }

    return this.mapToDto(app);
  }

  private mapToDto(app: Application): ApplicationResponseDto {
    return {
      applicationId: app.applicationId,
      name: app.name,
      userId: app.userId,
      organizationId: app.organizationId,
      testModeEnabled: app.testModeEnabled,
      whitelistRecipients: app.whitelistRecipients,
      status: app.status,
      createdBy: app.createdBy,
      updatedBy: app.updatedBy,
      createdOn: app.createdOn,
      updatedOn: app.updatedOn,
    };
  }

  async getAllApplicationsAsDto(
    query: PaginationQueryDto,
    organizationId: number,
  ): Promise<{ items: ApplicationResponseDto[]; meta: PaginationMeta }> {
    const baseConditions = [
      { field: 'status', value: Status.ACTIVE },
      { field: 'organizationId', value: organizationId },
    ];
    const searchableFields = ['name'];
    const { items, meta } = await super.findAllPaginated(
      query,
      'application',
      searchableFields,
      baseConditions,
    );

    return {
      items: items.map((app) => this.mapToDto(app)),
      meta,
    };
  }

  async createApplicationAsDto(
    applicationInput: CreateApplicationInput,
    requestUserId: number,
    organizationId: number,
  ): Promise<ApplicationResponseDto> {
    const app = await this.createApplication(applicationInput, requestUserId, organizationId);

    return this.mapToDto(app);
  }

  async updateApplicationAsDto(
    updateApplicationInput: UpdateApplicationInput,
    organizationId: number,
    userId?: number,
  ): Promise<ApplicationResponseDto> {
    const existing = await this.findById(updateApplicationInput.applicationId);

    if (!existing || existing.organizationId !== organizationId) {
      throw new NotFoundException(ErrorCodes.APP_NOT_FOUND, 'Application not found');
    }

    if (userId !== undefined) {
      existing.updatedBy = userId;
      await this.applicationsRepository.save(existing);
    }

    const app = await this.updateApplication(updateApplicationInput);

    return this.mapToDto(app);
  }

  async softDeleteApplicationAsDto(
    applicationId: number,
    organizationId: number,
  ): Promise<boolean> {
    const app = await this.findById(applicationId);

    if (!app || app.organizationId !== organizationId) {
      throw new NotFoundException(ErrorCodes.APP_NOT_FOUND, 'Application not found');
    }

    app.status = Status.INACTIVE;
    await this.applicationsRepository.save(app);

    return true;
  }

  async verifyWhitelist(inputWhitelist: string, applicationId?: number): Promise<boolean> {
    for (const [key, values] of Object.entries(inputWhitelist)) {
      // Convert provider key to number
      const numericKey = Number(key);
      const providerEntry = await this.providersService.getById(numericKey);

      // Check if provider exist
      if (!providerEntry) {
        this.logger.debug(`Provider ${key} does not exist`);
        return false;
      }

      // Check provider belongs to correct application when applicationId is provided for comparison
      if (applicationId && providerEntry.applicationId !== applicationId) {
        this.logger.debug(
          `Provider ${providerEntry.providerId} is not associated with application ${applicationId}`,
        );
        return false;
      }

      // Check values is an array
      if (!Array.isArray(values)) {
        this.logger.debug(`Key ${key} does not have an array as value`);
        return false;
      }

      // Check all whitelist elements of the array are strings
      for (const whitelistElement of values) {
        if (typeof whitelistElement !== 'string') {
          this.logger.debug(`Element ${whitelistElement} was not parsed as string`);
          return false;
        }
      }
    }

    return true;
  }
}
