import { Logger, Module } from '@nestjs/common';
import { WaTwilioBusinessService } from './wa-twilio-business.service';
import { ProvidersModule } from '../providers.module';
import { ProvidersService } from '../providers.service';

@Module({
  imports: [ProvidersModule],
  providers: [WaTwilioBusinessService, ProvidersService, Logger],
  exports: [WaTwilioBusinessService],
})
export class WaTwilioBusinessModule {}
