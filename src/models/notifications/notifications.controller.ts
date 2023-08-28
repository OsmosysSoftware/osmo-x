import { Controller, Post, Body } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationService: NotificationsService) {}

  @Post()
  async addNotification(@Body() notificationData: any) {
    const createdNotification =
      await this.notificationService.createNotification(notificationData);
    return {
      notification: createdNotification,
    };
  }
}
