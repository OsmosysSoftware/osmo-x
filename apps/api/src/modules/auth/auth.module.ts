import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { LocalStrategy } from './strategies/local.strategy';
import { AuthResolver } from './auth.resolver';
import { UsersModule } from '../users/users.module';
import { UsersService } from '../users/users.service';

@Module({
  imports: [PassportModule, ConfigModule, UsersModule],
  providers: [AuthResolver, AuthService, LocalStrategy, UsersService],
  exports: [AuthService, UsersService],
})
export class AuthModule {}
