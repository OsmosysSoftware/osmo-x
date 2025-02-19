import { forwardRef, Logger, Module } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Application } from './entities/application.entity';
import { ApplicationsResolver } from './applications.resolver';
import { UsersModule } from '../users/users.module';
import { UsersService } from '../users/users.service';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ProvidersModule } from '../providers/providers.module';
import { ProvidersService } from '../providers/providers.service';

@Module({
  // Import ServerApiKeysModule to resolve ApiKeyGuard dependency
  imports: [
    TypeOrmModule.forFeature([Application]),
    JwtModule,
    UsersModule,
    forwardRef(() => ProvidersModule),
  ],
  providers: [
    ApplicationsService,
    ApplicationsResolver,
    ConfigService,
    JwtService,
    UsersService,
    Logger,
    ProvidersService,
  ],
  exports: [TypeOrmModule],
})
export class ApplicationsModule {}
