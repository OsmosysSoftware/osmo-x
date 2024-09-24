import { Logger, Module } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Application } from './entities/application.entity';
import { ApplicationsResolver } from './applications.resolver';
import { UsersModule } from '../users/users.module';
import { UsersService } from '../users/users.service';
import { JwtModule, JwtService } from '@nestjs/jwt';

@Module({
  // Import ServerApiKeysModule to resolve ApiKeyGuard dependency
  imports: [TypeOrmModule.forFeature([Application]), JwtModule, UsersModule],
  providers: [ApplicationsService, ApplicationsResolver, JwtService, UsersService, Logger],
  exports: [TypeOrmModule],
})
export class ApplicationsModule {}
