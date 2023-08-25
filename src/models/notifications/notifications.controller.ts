import { Controller, Post, Body } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationService: NotificationsService) {}

  @Post('add')
  async addNotification(@Body() notificationData: any) {
    await this.notificationService.createNotification(notificationData);
    return { message: 'Notification created successfully' };
  }
}
