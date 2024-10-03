import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Application } from './entities/application.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateApplicationInput } from './dto/create-application.input';
import { UsersService } from '../users/users.service';
import { Status, UserRoles } from 'src/common/constants/database';
import { ApplicationResponse } from './dto/application-response.dto';
import { QueryOptionsDto } from 'src/common/graphql/dtos/query-options.dto';
import { CoreService } from 'src/common/graphql/services/core.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ApplicationsService extends CoreService<Application> {
  constructor(
    @InjectRepository(Application)
    private readonly applicationsRepository: Repository<Application>,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private configService: ConfigService,
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
    authorizationHeader: Request,
  ): Promise<Application> {
    const isAdmin = await this.checkAdminUser(authorizationHeader);

    if (!isAdmin) {
      throw new Error('Access Denied. Not an ADMIN.');
    }

    const userEntry = await this.getUserEntryFromToken(authorizationHeader);

    const newApplicationObject = new Application({
      name: applicationInput.name,
      userId: userEntry.userId,
    });

    const application = this.applicationsRepository.create(newApplicationObject);
    return this.applicationsRepository.save(application);
  }

  async checkAdminUser(authHeader: Request): Promise<boolean> {
    try {
      const userEntry = await this.getUserEntryFromToken(authHeader);

      // Check if the user has the ADMIN role
      if (userEntry.userRole === UserRoles.ADMIN) {
        return true;
      }

      return false;
    } catch (error) {
      throw error;
    }
  }

  async getUserEntryFromToken(authHeader: Request): Promise<User> {
    try {
      const bearerToken = authHeader.toString();

      if (!bearerToken || !bearerToken.startsWith('Bearer ')) {
        throw new UnauthorizedException('Missing or malformed authorization header');
      }

      const token = bearerToken.slice(7).trim();
      const secret = this.configService.getOrThrow('JWT_SECRET');

      // Decode the token to get the payload (which includes the user ID)
      const decodedToken = this.jwtService.verify(token, { secret });

      if (!decodedToken || !decodedToken.userId) {
        throw new UnauthorizedException('Invalid token');
      }

      // Find the related user entry using the user ID from the token
      const userEntry = await this.usersService.findByUserId(decodedToken.userId);

      if (!userEntry) {
        throw new UnauthorizedException('User not found');
      }

      return userEntry;
    } catch (error) {
      throw error;
    }
  }

  async getAllApplications(
    options: QueryOptionsDto,
    authorizationHeader: Request,
  ): Promise<ApplicationResponse> {
    const isAdmin = await this.checkAdminUser(authorizationHeader);

    if (!isAdmin) {
      throw new Error('Access Denied. Not an ADMIN.');
    }

    const baseConditions = [];
    const searchableFields = ['name'];

    const { items, total } = await super.findAll(
      options,
      'application',
      searchableFields,
      baseConditions,
    );
    return new ApplicationResponse(items, total, options.offset, options.limit);
  }
}
