import { Logger, Module } from '@nestjs/common';
import { SmsPlivoService } from './sms-plivo.service';
import { ConfigModule } from '@nestjs/config';
import { ProvidersModule } from '../providers.module';

@Module({
  imports: [ConfigModule, ProvidersModule],
  providers: [SmsPlivoService, Logger],
  exports: [SmsPlivoService],
})
export class SmsPlivoModule {}
