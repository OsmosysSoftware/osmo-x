import { Logger, Module } from '@nestjs/common';
import { SmsTwilioService } from './sms-twilio.service';
import { ConfigModule } from '@nestjs/config';
import { ProvidersModule } from '../providers.module';
import { ProvidersService } from '../providers.service';

@Module({
  imports: [ConfigModule, ProvidersModule],
  providers: [SmsTwilioService, ProvidersService, Logger],
  exports: [SmsTwilioService],
})
export class SmsTwilioModule {}
