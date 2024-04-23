import { Injectable } from '@nestjs/common';
import { Application } from './entities/application.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateApplicationInput } from './dto/create-application.input';
import { ServerApiKeysService } from '../server-api-keys/server-api-keys.service';
import { UsersService } from '../users/users.service';
import { UserRoles } from 'src/common/constants/database';

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectRepository(Application)
    private readonly applicationsRepository: Repository<Application>,
    private readonly serverApiKeysService: ServerApiKeysService,
    private readonly usersService: UsersService,
  ) {}

  async findById(applicationId: number): Promise<Application | undefined> {
    return this.applicationsRepository.findOne({ where: { applicationId } });
  }

  async findByUserId(userId: number): Promise<Application | undefined> {
    return this.applicationsRepository.findOne({ where: { userId } });
  }

  async createApplication(
    applicationInput: CreateApplicationInput,
    authorizationHeader: Request,
  ): Promise<Application> {
    const isAdmin = await this.checkAdminUser(authorizationHeader);

    if (!isAdmin) {
      throw new Error('Access Denied. Not an ADMIN.');
    }

    const application = this.applicationsRepository.create(applicationInput);
    return this.applicationsRepository.save(application);
  }

  async checkAdminUser(authHeader: Request): Promise<boolean> {
    try {
      const bearerToken = authHeader.toString();
      let apiKeyToken = null;

      if (bearerToken.startsWith('Bearer ')) {
        apiKeyToken = bearerToken.substring(7);
      } else {
        throw new Error('Invalid bearer token format');
      }

      // Find the related server api key entry
      const apiKeyEntry = await this.serverApiKeysService.findByServerApiKey(apiKeyToken);
      // Find the related application entry
      const applicationEntry = await this.findById(apiKeyEntry.applicationId);
      // Find the related user entry
      const userEntry = await this.usersService.findByUserId(applicationEntry.userId);

      // Check if ADMIN
      if (userEntry.userRole === UserRoles.ADMIN) {
        return true;
      }

      return false;
    } catch (error) {
      throw error;
    }
  }
}
