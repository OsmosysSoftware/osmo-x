import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Application } from './entities/application.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateApplicationInput } from './dto/create-application.input';
import { UsersService } from '../users/users.service';
import { Status } from 'src/common/constants/database';
import { ApplicationResponse } from './dto/application-response.dto';
import { QueryOptionsDto } from 'src/common/graphql/dtos/query-options.dto';
import { CoreService } from 'src/common/graphql/services/core.service';
import { User } from '../users/entities/user.entity';
import { UpdateApplicationInput } from './dto/update-application.input';

@Injectable()
export class ApplicationsService extends CoreService<Application> {
  constructor(
    @InjectRepository(Application)
    private readonly applicationsRepository: Repository<Application>,
    private readonly usersService: UsersService,
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
      throw new Error('Application does not exist. Update failed.');
    }

    const application = await this.findById(updateApplicationInput.applicationId);

    application.name = updateApplicationInput.name ? updateApplicationInput.name : application.name;

    if (application.testModeEnabled !== updateApplicationInput.testModeEnabled) {
      application.testModeEnabled = updateApplicationInput.testModeEnabled;
    }

    application.whitelistRecipients = updateApplicationInput.whitelistRecipients
      ? updateApplicationInput.whitelistRecipients
      : application.whitelistRecipients;

    await this.applicationsRepository.save(application);
    return await this.applicationsRepository.findOne({
      where: { applicationId: updateApplicationInput.applicationId },
    });
  }
}
