import { Controller, Post, Body } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { Notification } from './entities/notification.entity';
import { CreateNotificationDto } from './dtos/create-notification.dto';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationService: NotificationsService) {}

  @Post()
  async addNotification(
    @Body() notificationData: CreateNotificationDto,
  ): Promise<{ notification: Notification }> {
    const createdNotification = await this.notificationService.createNotification(notificationData);
    return {
      notification: createdNotification,
    };
  }
}
