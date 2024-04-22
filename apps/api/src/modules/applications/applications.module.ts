import { Module } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Application } from './entities/application.entity';
import { ApplicationsResolver } from './applications.resolver';
import { ServerApiKeysService } from '../server-api-keys/server-api-keys.service';
import { ServerApiKeysModule } from '../server-api-keys/server-api-keys.module';

@Module({
  // Import ServerApiKeysModule to resolve ApiKeyGuard dependency
  imports: [TypeOrmModule.forFeature([Application]), ServerApiKeysModule],
  providers: [ApplicationsService, ApplicationsResolver, ServerApiKeysService],
  exports: [TypeOrmModule],
})
export class ApplicationsModule {}
