import { Logger, Module } from '@nestjs/common';
import { WaTwilioBusinessService } from './wa-twilio-business.service';
import { ProvidersModule } from '../providers.module';

@Module({
  imports: [ProvidersModule],
  providers: [WaTwilioBusinessService, Logger],
  exports: [WaTwilioBusinessService],
})
export class WaTwilioBusinessModule {}
