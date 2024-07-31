import { Logger, Module } from '@nestjs/common';
import { SmtpService } from './smtp.service';
import { ConfigModule } from '@nestjs/config';
import { ProvidersModule } from '../providers.module';
import { ProvidersService } from '../providers.service';

@Module({
  imports: [ConfigModule, ProvidersModule],
  providers: [SmtpService, ProvidersService, Logger],
  exports: [SmtpService],
})
export class SmtpModule {}
