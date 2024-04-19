import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoginResponse } from './dto/login-response';
import { UsersService } from '../users/users.service';
import { comparePasswords } from 'src/common/utils/bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private configService: ConfigService,
    private readonly usersService: UsersService,
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

  async login(loginUserInput): Promise<LoginResponse> {
    const token = this.configService.getOrThrow<string>('SERVER_API_KEY');
    return {
      token,
      user: loginUserInput.username,
    };
  }
}
