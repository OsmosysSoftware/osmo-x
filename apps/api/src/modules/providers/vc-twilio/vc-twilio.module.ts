import { Logger, Module } from '@nestjs/common';
import { VcTwilioService } from './vc-twilio.service';
import { ProvidersModule } from '../providers.module';

@Module({
  imports: [ProvidersModule],
  providers: [VcTwilioService, Logger],
  exports: [VcTwilioService],
})
export class VcTwilioModule {}
