import { Controller, Post, Body } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NOTIFICATION_CREATE_SUCCESS_MSG } from 'src/common/constants/notifications';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationService: NotificationsService) {}

  @Post('add')
  async addNotification(@Body() notificationData: any) {
    const createdNotification =
      await this.notificationService.createNotification(notificationData);
    return {
      message: NOTIFICATION_CREATE_SUCCESS_MSG,
      notification: createdNotification,
    };
  }
}
