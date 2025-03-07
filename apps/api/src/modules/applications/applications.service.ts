import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Application } from './entities/application.entity';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateApplicationInput } from './dto/create-application.input';
import { UsersService } from '../users/users.service';
import { Status } from 'src/common/constants/database';
import { ApplicationResponse } from './dto/application-response.dto';
import { QueryOptionsDto } from 'src/common/graphql/dtos/query-options.dto';
import { CoreService } from 'src/common/graphql/services/core.service';
import { User } from '../users/entities/user.entity';
import { UpdateApplicationInput } from './dto/update-application.input';
import { ProvidersService } from '../providers/providers.service';
import { ConfigService } from '@nestjs/config';

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

  async createApplication(
    applicationInput: CreateApplicationInput,
    requestUserId: number,
  ): Promise<Application> {
    const userEntryFromContext = await this.getUserEntryFromContext(requestUserId);

    const newApplicationObject = new Application({
      name: applicationInput.name,
      userId: userEntryFromContext.userId,
    });

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
        throw new Error(
          'Whitelist verification failed. Please check the inputted whitelist values and try again',
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
        throw new UnauthorizedException('User not found');
      }

      return userEntry;
    } catch (error) {
      throw error;
    }
  }

  async getAllApplications(options: QueryOptionsDto): Promise<ApplicationResponse> {
    const baseConditions = [{ field: 'status', value: Status.ACTIVE }];
    const searchableFields = ['name'];

    const { items, total } = await super.findAll(
      options,
      'application',
      searchableFields,
      baseConditions,
    );
    return new ApplicationResponse(items, total, options.offset, options.limit);
  }

  async updateApplication(updateApplicationInput: UpdateApplicationInput): Promise<Application> {
    if (!(await this.findById(updateApplicationInput.applicationId))) {
      throw new BadRequestException('Application does not exist. Update failed.');
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
          throw new Error(
            'Whitelist verification failed. Please check the inputted whitelist values and try again',
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
