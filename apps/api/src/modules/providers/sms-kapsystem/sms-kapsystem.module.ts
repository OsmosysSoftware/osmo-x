import { Logger, Module } from '@nestjs/common';
import { SmsKapsystemService } from './sms-kapsystem.service';
import { ConfigModule } from '@nestjs/config';
import { ProvidersModule } from '../providers.module';
import { ProvidersService } from '../providers.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule, ConfigModule, ProvidersModule],
  providers: [SmsKapsystemService, ProvidersService, Logger],
  exports: [SmsKapsystemService],
})
export class SmsKapsystemModule {}
