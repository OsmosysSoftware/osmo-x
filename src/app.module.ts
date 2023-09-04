import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationsModule } from './models/notifications/notifications.module';
import { SmtpService } from './services/email/smtp/smtp.service';
import { BullModule } from '@nestjs/bull';
import { DatabaseModule } from './database/database.module';

const configService = new ConfigService();
@Module({
  imports: [
    ConfigModule.forRoot(),
    DatabaseModule,
    BullModule.forRoot({
      redis: {
        host: configService.getOrThrow<string>('REDIS_HOST'),
        port: +configService.getOrThrow<number>('REDIS_PORT'),
      },
    }),
    ScheduleModule.forRoot(),
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService, SmtpService],
})
export class AppModule {}
