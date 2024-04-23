import { Module } from '@nestjs/common';
import { WaTwilioService } from './wa-twilio.service';
import { ConfigModule } from '@nestjs/config';
import { ProvidersModule } from '../providers.module';
import { ProvidersService } from '../providers.service';

@Module({
  imports: [ConfigModule, ProvidersModule],
  providers: [WaTwilioService, ProvidersService],
  exports: [WaTwilioService],
})
export class WaTwilioModule {}
