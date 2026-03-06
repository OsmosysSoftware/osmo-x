import { Logger, Module } from '@nestjs/common';
import { PushSnsService } from './push-sns.service';
import { ConfigModule } from '@nestjs/config';
import { ProvidersModule } from '../providers.module';

@Module({
  imports: [ConfigModule, ProvidersModule],
  providers: [PushSnsService, Logger],
  exports: [PushSnsService],
})
export class PushSnsModule {}
