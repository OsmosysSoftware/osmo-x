import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoginResponse } from './dto/login-response';
import { UsersService } from '../users/users.service';
import { comparePasswords } from 'src/common/utils/bcrypt';
import { LoginUserInput } from './dto/login-user.input';
import { ServerApiKeysService } from '../server-api-keys/server-api-keys.service';
import { UserRoles } from 'src/common/constants/database';

@Injectable()
export class AuthService {
  constructor(
    private configService: ConfigService,
    private readonly usersService: UsersService,
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
    const token = this.configService.getOrThrow<string>('SERVER_API_KEY');
    const tokenList = await this.setTokenList(loginUserInput.username);

    return {
      token,
      user: loginUserInput.username,
      allKeys: tokenList,
    };
  }

  async setTokenList(inputUserName: string): Promise<string[] | null> {
    let listOfKeys = null;

    // Get the details of user
    const entry = await this.usersService.findByUsername(inputUserName);

    // Get all active keys if ADMIN
    if (entry.userRole === UserRoles.ADMIN) {
      const allKeyEntries = await this.serverApiKeysService.findAllWithStatusOne();
      listOfKeys = allKeyEntries.map((key) => key.apiKey);
    }

    return listOfKeys;
  }
}
