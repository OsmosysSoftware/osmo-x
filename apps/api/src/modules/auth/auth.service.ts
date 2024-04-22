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
    let tokenList = null;
    const entry = await this.usersService.findByUsername(loginUserInput.username);

    // Get all active keys if ADMIN has logged in
    if (entry.userRole === UserRoles.ADMIN) {
      const allKeyEntries = await this.serverApiKeysService.findAllWithStatusOne();
      tokenList = allKeyEntries.map((key) => key.apiKey);
    }

    return {
      token,
      user: loginUserInput.username,
      allKeys: tokenList,
    };
  }
}
