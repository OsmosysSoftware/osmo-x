import { Module } from '@nestjs/common';
import { VcTwilioService } from './vc-twilio.service';
import { ProvidersModule } from '../providers.module';
import { ProvidersService } from '../providers.service';

@Module({
  imports: [ProvidersModule],
  providers: [VcTwilioService, ProvidersService],
  exports: [VcTwilioService],
})
export class VcTwilioModule {}
