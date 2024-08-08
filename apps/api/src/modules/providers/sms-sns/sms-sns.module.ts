import { Logger, Module } from '@nestjs/common';
import { SmsSnsService } from './sms-sns.service';
import { ConfigModule } from '@nestjs/config';
import { ProvidersModule } from '../providers.module';
import { ProvidersService } from '../providers.service';

@Module({
  imports: [ConfigModule, ProvidersModule],
  providers: [SmsSnsService, ProvidersService, Logger],
  exports: [SmsSnsService],
})
export class SmsSnsModule {}
