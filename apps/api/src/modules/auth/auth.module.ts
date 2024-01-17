import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { LocalStrategy } from './strategies/local.strategy';
import { AuthResolver } from './auth.resolver';

@Module({
  imports: [PassportModule, ConfigModule],
  providers: [AuthResolver, AuthService, LocalStrategy],
  exports: [AuthService],
})
export class AuthModule {}
