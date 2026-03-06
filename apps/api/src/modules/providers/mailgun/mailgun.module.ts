import { Logger, Module } from '@nestjs/common';
import { MailgunService } from './mailgun.service';
import { ConfigModule } from '@nestjs/config';
import { ProvidersModule } from '../providers.module';

@Module({
  imports: [ConfigModule, ProvidersModule],
  providers: [MailgunService, Logger],
  exports: [MailgunService],
})
export class MailgunModule {}
