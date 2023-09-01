import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseConfiguration } from './config/database/configuration';
import { NotificationsModule } from './models/notifications/notifications.module';
import { SmtpService } from './services/email/smtp/smtp.service';
import { BullModule } from '@nestjs/bull';

const configService = new ConfigService();
@Module({
  imports: [
    ConfigModule.forRoot(),
    BullModule.forRoot({
      redis: {
        host: configService.getOrThrow<string>('REDIS_HOST'),
        port: +configService.getOrThrow<number>('REDIS_PORT'),
      },
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useClass: DatabaseConfiguration,
    }),
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService, SmtpService],
})
export class AppModule {}
