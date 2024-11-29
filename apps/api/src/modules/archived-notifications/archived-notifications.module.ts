import { forwardRef, Logger, Module } from '@nestjs/common';
import { ArchivedNotificationsService } from './archived-notifications.service';
import { ArchivedNotification } from './entities/archived-notification.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsModule } from '../notifications/notifications.module';
import { ConfigService } from '@nestjs/config';
import { ArchivedNotificationsController } from './archived-notifications.controller';
import { ArchivedNotificationsResolver } from './archived-notifications.resolver';

@Module({
  imports: [
    TypeOrmModule.forFeature([ArchivedNotification]),
    forwardRef(() => NotificationsModule),
  ],
  providers: [ArchivedNotificationsService, ArchivedNotificationsResolver, Logger, ConfigService],
  exports: [ArchivedNotificationsService],
  controllers: [ArchivedNotificationsController],
})
export class ArchivedNotificationsModule {}
