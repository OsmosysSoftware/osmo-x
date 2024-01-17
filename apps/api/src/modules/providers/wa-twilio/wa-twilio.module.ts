import { Module } from '@nestjs/common';
import { WaTwilioService } from './wa-twilio.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [WaTwilioService],
  exports: [WaTwilioService],
})
export class WaTwilioModule {}
