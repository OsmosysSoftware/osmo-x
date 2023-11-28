import { Module } from '@nestjs/common';
import { MailgunService } from './mailgun.service';
import { ConfigModule } from '@nestjs/config';

@Module({ imports: [ConfigModule], providers: [MailgunService], exports: [MailgunService] })
export class MailgunModule {}
