import { Logger, Module } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Application } from './entities/application.entity';
import { ApplicationsResolver } from './applications.resolver';
import { ServerApiKeysService } from '../server-api-keys/server-api-keys.service';
import { ServerApiKeysModule } from '../server-api-keys/server-api-keys.module';
import { UsersModule } from '../users/users.module';
import { UsersService } from '../users/users.service';

@Module({
  // Import ServerApiKeysModule to resolve ApiKeyGuard dependency
  imports: [TypeOrmModule.forFeature([Application]), ServerApiKeysModule, UsersModule],
  providers: [
    ApplicationsService,
    ApplicationsResolver,
    ServerApiKeysService,
    UsersService,
    Logger,
  ],
  exports: [TypeOrmModule],
})
export class ApplicationsModule {}
