import { Injectable } from '@nestjs/common';
import { LoginResponse } from './dto/login-response';
import { UsersService } from '../users/users.service';
import { comparePasswords } from 'src/common/utils/bcrypt';
import { LoginUserInput } from './dto/login-user.input';
import { ServerApiKeysService } from '../server-api-keys/server-api-keys.service';
import { UserRoles } from 'src/common/constants/database';
import { ServerApiKey } from '../server-api-keys/entities/server-api-key.entity';
import { ApplicationsService } from '../applications/applications.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly applicationsService: ApplicationsService,
    private readonly serverApiKeysService: ServerApiKeysService,
  ) {}

  async validateUser(username: string, password: string): Promise<string> {
    const entry = await this.usersService.findByUsername(username);

    if (!entry || !entry.username) {
      throw new Error('User does not exist');
    }

    const adminPassword = entry.password;
    const match = comparePasswords(password, adminPassword);

    if (match) {
      return username;
    }

    return null;
  }

  async login(loginUserInput: LoginUserInput): Promise<LoginResponse> {
    try {
      const token = await this.getUserToken(loginUserInput.username);
      const tokenList = await this.setTokenList(loginUserInput.username);

      return {
        token,
        user: loginUserInput.username,
        allKeys: tokenList,
      };
    } catch (error) {
      throw new Error(`Error while logging in: ${error}`);
    }
  }

  async getUserToken(inputUserName: string): Promise<string> {
    // Get the api key related to the user
    const userEntry = await this.usersService.findByUsername(inputUserName);
    const applicationEntry = await this.applicationsService.findByUserId(userEntry.userId);
    const serverApiKeyEntry = await this.serverApiKeysService.findByRelatedApplicationId(
      applicationEntry.applicationId,
    );
    return serverApiKeyEntry.apiKey;
  }

  async setTokenList(inputUserName: string): Promise<ServerApiKey[] | null> {
    let listOfKeys = null;

    // Get the details of user
    const entry = await this.usersService.findByUsername(inputUserName);

    // Get all active keys if ADMIN
    if (entry.userRole === UserRoles.ADMIN) {
      listOfKeys = await this.serverApiKeysService.findAllWithStatusOne();
    }

    return listOfKeys;
  }
}
