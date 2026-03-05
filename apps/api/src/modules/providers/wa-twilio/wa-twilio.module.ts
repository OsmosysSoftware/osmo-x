import { Logger, Module } from '@nestjs/common';
import { WaTwilioService } from './wa-twilio.service';
import { ConfigModule } from '@nestjs/config';
import { ProvidersModule } from '../providers.module';

@Module({
  imports: [ConfigModule, ProvidersModule],
  providers: [WaTwilioService, Logger],
  exports: [WaTwilioService],
})
export class WaTwilioModule {}
