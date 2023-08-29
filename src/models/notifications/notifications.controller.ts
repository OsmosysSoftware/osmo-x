import { Controller, Post, Body } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationData } from 'src/common/types/NotificationData';
import { Notification } from './entities/notification.entity';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationService: NotificationsService) {}

  @Post()
  async addNotification(
    @Body() notificationData: NotificationData,
  ): Promise<{ notification: Notification[] }> {
    const createdNotification = await this.notificationService.createNotification(notificationData);
    return {
      notification: createdNotification,
    };
  }
}
