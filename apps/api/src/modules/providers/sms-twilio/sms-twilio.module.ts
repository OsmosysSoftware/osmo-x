import { Module } from '@nestjs/common';
import { SmsTwilioService } from './sms-twilio.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [SmsTwilioService],
  exports: [SmsTwilioService],
})
export class SmsTwilioModule {}
