import { forwardRef, Logger, Module } from '@nestjs/common';
import { ArchivedNotificationsService } from './archived-notifications.service';
import { ArchivedNotification } from './entities/archived-notification.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ArchivedNotification]),
    forwardRef(() => NotificationsModule),
  ],
  providers: [ArchivedNotificationsService, Logger],
  exports: [ArchivedNotificationsService],
})
export class ArchivedNotificationsModule {}
