import { Module } from '@nestjs/common';
import { SmsPlivoService } from './sms-plivo.service';
import { ConfigModule } from '@nestjs/config';
import { ProvidersModule } from '../providers.module';
import { ProvidersService } from '../providers.service';

@Module({
  imports: [ConfigModule, ProvidersModule],
  providers: [SmsPlivoService, ProvidersService],
  exports: [SmsPlivoService],
})
export class SmsPlivoModule {}
