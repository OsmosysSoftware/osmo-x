import { Module } from '@nestjs/common';
import { MailgunService } from './mailgun.service';
import { ConfigModule } from '@nestjs/config';
import { ProvidersModule } from '../providers.module';
import { ProvidersService } from '../providers.service';

@Module({
  imports: [ConfigModule, ProvidersModule],
  providers: [MailgunService, ProvidersService],
  exports: [MailgunService],
})
export class MailgunModule {}
