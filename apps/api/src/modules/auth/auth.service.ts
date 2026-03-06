import { Injectable } from '@nestjs/common';
import { AuthException, NotFoundException } from 'src/common/exceptions/app.exception';
import { ErrorCodes } from 'src/common/constants/error-codes';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { LoginResponse } from './dto/login-response';
import { AuthResponseDto } from './dto/auth-response.dto';
import { UsersService } from '../users/users.service';
import { comparePasswords } from 'src/common/utils/bcrypt';
import { LoginUserInput } from './dto/login-user.input';
import { JwtPayload } from 'src/common/constants/jwtInterface';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new NotFoundException(ErrorCodes.USER_NOT_FOUND, 'User does not exist');
    }

    const adminPassword = user.password;
    const valid = comparePasswords(password, adminPassword);

    if (user && valid) {
      delete user.password;
      return user;
    }

    return null;
  }

  /** GraphQL login - returns simple token (backward compatible) */
  async loginGraphql(loginUserInput: LoginUserInput): Promise<LoginResponse> {
    try {
      const user = await this.validateUser(loginUserInput.email, loginUserInput.password);

      if (!user) {
        throw new AuthException(ErrorCodes.AUTH_INVALID_CREDENTIALS, 'Invalid credentials');
      }

      const payload: JwtPayload = {
        email: user.email,
        userId: user.userId,
        role: user.userRole,
        organizationId: user.organizationId,
      };

      return {
        token: this.jwtService.sign(payload),
      };
    } catch (error) {
      throw new AuthException(ErrorCodes.AUTH_INVALID_CREDENTIALS, 'Login failed');
    }
  }

  /** REST login - returns access + refresh tokens */
  async login(loginUserInput: LoginUserInput): Promise<AuthResponseDto> {
    const user = await this.validateUser(loginUserInput.email, loginUserInput.password);

    if (!user) {
      throw new AuthException(ErrorCodes.AUTH_INVALID_CREDENTIALS, 'Invalid credentials');
    }

    return this.generateAuthResponse(user);
  }

  /** Exchange refresh token for new access + refresh tokens */
  async refreshToken(userPayload: JwtPayload): Promise<AuthResponseDto> {
    const user = await this.usersService.findByUserId(userPayload.userId);

    if (!user) {
      throw new AuthException(ErrorCodes.AUTH_UNAUTHORIZED, 'User not found');
    }

    delete user.password;
    return this.generateAuthResponse(user);
  }

  /** Get current user profile */
  async getProfile(userId: number): Promise<Omit<User, 'password'>> {
    const user = await this.usersService.findByUserId(userId);

    if (!user) {
      throw new NotFoundException(ErrorCodes.USER_NOT_FOUND, 'User not found');
    }

    delete user.password;
    return user;
  }

  private generateAuthResponse(user: User): AuthResponseDto {
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);
    const expiresIn = this.parseExpirationToSeconds(
      this.configService.get<string>('JWT_EXPIRES_IN', '7d'),
    );

    return {
      accessToken,
      refreshToken,
      user: {
        userId: user.userId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.userRole,
        organizationId: user.organizationId,
      },
      expiresIn,
    };
  }

  private generateAccessToken(user: User): string {
    const payload = {
      sub: user.userId,
      email: user.email,
      userId: user.userId,
      role: user.userRole,
      organizationId: user.organizationId,
      type: 'access',
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      expiresIn: this.parseExpirationToSeconds(
        this.configService.get<string>('JWT_EXPIRES_IN', '7d'),
      ),
    });
  }

  private generateRefreshToken(user: User): string {
    const payload = {
      sub: user.userId,
      email: user.email,
      type: 'refresh',
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.parseExpirationToSeconds(
        this.configService.get<string>('JWT_REFRESH_EXPIRATION', '30d'),
      ),
    });
  }

  private parseExpirationToSeconds(expiration: string): number {
    const match = expiration.match(/^(\d+)([smhd])$/);

    if (!match) {
      return 604800; // 7 days default
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];
    const multipliers: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };

    return value * (multipliers[unit] || 1);
  }
}
