import { Module } from '@nestjs/common';
import { ServerApiKeysService } from './server-api-keys.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServerApiKey } from './entities/server-api-key.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ServerApiKey])],
  providers: [ServerApiKeysService],
  exports: [TypeOrmModule],
})
export class ServerApiKeysModule {}
