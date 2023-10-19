import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { SmtpService } from './services/email/smtp/smtp.service';
import { BullModule } from '@nestjs/bull';
import { DatabaseModule } from './database/database.module';
import { MailgunService } from './services/email/mailgun/mailgun.service';
import { Wa360dialogService } from './services/whatsapp/wa360dialog/wa360dialog.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    ConfigModule.forRoot(),
    DatabaseModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.getOrThrow<string>('REDIS_HOST'),
          port: +configService.getOrThrow<number>('REDIS_PORT'),
        },
      }),
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
    NotificationsModule,
    HttpModule,
  ],
  controllers: [AppController],
  providers: [AppService, SmtpService, MailgunService, Wa360dialogService],
})
export class AppModule {}
