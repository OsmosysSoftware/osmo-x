import { Module } from '@nestjs/common';
import { ServerApiKeysService } from './server-api-keys.service';
import { ServerApiKeysV1Controller } from './server-api-keys-v1.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServerApiKey } from './entities/server-api-key.entity';
import { ServerApiKeysResolver } from './server-api-keys.resolver';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [TypeOrmModule.forFeature([ServerApiKey]), JwtModule],
  providers: [ServerApiKeysService, ServerApiKeysResolver],
  controllers: [ServerApiKeysV1Controller],
  exports: [TypeOrmModule],
})
export class ServerApiKeysModule {}
