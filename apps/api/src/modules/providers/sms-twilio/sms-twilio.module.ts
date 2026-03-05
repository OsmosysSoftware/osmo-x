import { Logger, Module } from '@nestjs/common';
import { SmsTwilioService } from './sms-twilio.service';
import { ConfigModule } from '@nestjs/config';
import { ProvidersModule } from '../providers.module';

@Module({
  imports: [ConfigModule, ProvidersModule],
  providers: [SmsTwilioService, Logger],
  exports: [SmsTwilioService],
})
export class SmsTwilioModule {}
