import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseConfiguration } from './config/database/configuration';
import { NotificationsModule } from './models/notifications/notifications.module';
import { SmtpService } from './services/email/smtp.service';

@Module({
  imports: [
    ConfigModule.forRoot(),
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
