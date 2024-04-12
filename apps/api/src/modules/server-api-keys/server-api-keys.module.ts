import { Module } from '@nestjs/common';
import { ServerApiKeysService } from './server-api-keys.service';
import { ServerApiKeysResolver } from './server-api-keys.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServerApiKey } from './entities/server-api-key.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ServerApiKey])],
  providers: [ServerApiKeysResolver, ServerApiKeysService],
  exports: [TypeOrmModule],
})
export class ServerApiKeysModule {}
