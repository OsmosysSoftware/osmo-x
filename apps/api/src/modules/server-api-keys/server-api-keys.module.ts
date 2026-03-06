import { Module } from '@nestjs/common';
import { ServerApiKeysService } from './server-api-keys.service';
import { ServerApiKeysController } from './server-api-keys.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServerApiKey } from './entities/server-api-key.entity';
import { ServerApiKeysResolver } from './server-api-keys.resolver';
import { JwtModule } from '@nestjs/jwt';
import { ApplicationsModule } from '../applications/applications.module';

@Module({
  imports: [TypeOrmModule.forFeature([ServerApiKey]), JwtModule, ApplicationsModule],
  providers: [ServerApiKeysService, ServerApiKeysResolver],
  controllers: [ServerApiKeysController],
  exports: [TypeOrmModule],
})
export class ServerApiKeysModule {}
