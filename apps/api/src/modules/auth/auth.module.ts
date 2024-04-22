import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { LocalStrategy } from './strategies/local.strategy';
import { AuthResolver } from './auth.resolver';
import { UsersModule } from '../users/users.module';
import { UsersService } from '../users/users.service';
import { ServerApiKeysModule } from '../server-api-keys/server-api-keys.module';
import { ServerApiKeysService } from '../server-api-keys/server-api-keys.service';
import { ApplicationsModule } from '../applications/applications.module';
import { ApplicationsService } from '../applications/applications.service';

@Module({
  imports: [PassportModule, ConfigModule, UsersModule, ServerApiKeysModule, ApplicationsModule],
  providers: [
    AuthResolver,
    AuthService,
    LocalStrategy,
    UsersService,
    ServerApiKeysService,
    ApplicationsService,
  ],
  exports: [AuthService, UsersService, ServerApiKeysService, ApplicationsService],
})
export class AuthModule {}
