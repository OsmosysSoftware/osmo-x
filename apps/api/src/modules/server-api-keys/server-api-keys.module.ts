import { Module } from '@nestjs/common';
import { ServerApiKeysService } from './server-api-keys.service';
import { ServerApiKeysResolver } from './server-api-keys.resolver';

@Module({
  providers: [ServerApiKeysResolver, ServerApiKeysService],
})
export class ServerApiKeysModule {}
