import { Logger, Module } from '@nestjs/common';
import { SmsSnsService } from './sms-sns.service';
import { ConfigModule } from '@nestjs/config';
import { ProvidersModule } from '../providers.module';

@Module({
  imports: [ConfigModule, ProvidersModule],
  providers: [SmsSnsService, Logger],
  exports: [SmsSnsService],
})
export class SmsSnsModule {}
