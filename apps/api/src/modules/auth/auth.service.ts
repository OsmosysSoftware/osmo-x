import { Injectable } from '@nestjs/common';
import { LoginResponse } from './dto/login-response';
import { UsersService } from '../users/users.service';
import { comparePasswords } from 'src/common/utils/bcrypt';
import { LoginUserInput } from './dto/login-user.input';
import { JwtPayload } from 'src/common/constants/jwtInterface';
import { User } from '../users/entities/user.entity';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string): Promise<User> {
    const user = await this.usersService.findByUsername(username);

    if (!user || !user.username) {
      throw new Error('User does not exist');
    }

    const adminPassword = user.password;
    const valid = comparePasswords(password, adminPassword);

    if (user && valid) {
      delete user.password;
      return user;
    }

    return null;
  }

  async login(loginUserInput: LoginUserInput): Promise<LoginResponse> {
    try {
      const user = await this.validateUser(loginUserInput.username, loginUserInput.password);

      if (!user) {
        throw new Error('Invalid credentials. Please provide valid username and password.');
      }

      const payload: JwtPayload = {
        username: user.username,
        userId: user.userId,
        role: user.userRole,
      };
      return {
        token: this.jwtService.sign(payload),
      };
    } catch (error) {
      throw new Error(`Error while logging in: ${error.message}`);
    }
  }
}
