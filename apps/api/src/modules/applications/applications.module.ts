import { forwardRef, Logger, Module } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Application } from './entities/application.entity';
import { ApplicationsResolver } from './applications.resolver';
import { ApplicationsController } from './applications.controller';
import { UsersModule } from '../users/users.module';
import { UsersService } from '../users/users.service';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ProvidersModule } from '../providers/providers.module';

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
  ],
  controllers: [ApplicationsController],
  exports: [TypeOrmModule, ApplicationsService],
})
export class ApplicationsModule {}
