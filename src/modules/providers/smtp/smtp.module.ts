import { Module } from '@nestjs/common';
import { SmtpService } from './smtp.service';
import { ConfigModule } from '@nestjs/config';

@Module({ imports: [ConfigModule], providers: [SmtpService], exports: [SmtpService] })
export class SmtpModule {}
