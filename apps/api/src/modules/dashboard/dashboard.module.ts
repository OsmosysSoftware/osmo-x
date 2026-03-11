import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Notification } from '../notifications/entities/notification.entity';
import { ArchivedNotification } from '../archived-notifications/entities/archived-notification.entity';
import { Application } from '../applications/entities/application.entity';
import { Provider } from '../providers/entities/provider.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, ArchivedNotification, Application, Provider]),
    ConfigModule,
    JwtModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
