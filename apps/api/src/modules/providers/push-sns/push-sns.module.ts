import { Logger, Module } from '@nestjs/common';
import { PushSnsService } from './push-sns.service';
import { ConfigModule } from '@nestjs/config';
import { ProvidersModule } from '../providers.module';
import { ProvidersService } from '../providers.service';

@Module({
  imports: [ConfigModule, ProvidersModule],
  providers: [PushSnsService, ProvidersService, Logger],
  exports: [PushSnsService],
})
export class PushSnsModule {}
