import { Logger, Module } from '@nestjs/common';
import { SmtpService } from './smtp.service';
import { ConfigModule } from '@nestjs/config';
import { ProvidersModule } from '../providers.module';

@Module({
  imports: [ConfigModule, ProvidersModule],
  providers: [SmtpService, Logger],
  exports: [SmtpService],
})
export class SmtpModule {}
