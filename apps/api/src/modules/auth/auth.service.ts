import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoginResponse } from './dto/login-response';

@Injectable()
export class AuthService {
  constructor(private configService: ConfigService) {}

  async validateUser(username: string, password: string): Promise<string> {
    const adminUsername = this.configService.getOrThrow<string>('ADMIN_USERNAME');
    const adminPassword = this.configService.getOrThrow<string>('ADMIN_PASSWORD');

    if (username === adminUsername && password === adminPassword) {
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
