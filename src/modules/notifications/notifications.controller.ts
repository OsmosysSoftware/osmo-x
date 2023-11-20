import {
  Controller,
  Post,
  Body,
  Logger,
  HttpException,
  UseGuards,
  Get,
  Param,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dtos/create-notification.dto';
import { JsendFormatter } from 'src/common/jsend-formatter';
import { ApiKeyGuard } from 'src/common/guards/api-key/api-key.guard';

@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationService: NotificationsService,
    private readonly jsend: JsendFormatter,
    private logger: Logger,
  ) {}

  @Post()
  @UseGuards(ApiKeyGuard)
  async addNotification(
    @Body() notificationData: CreateNotificationDto,
  ): Promise<Record<string, unknown>> {
    try {
      const createdNotification =
        await this.notificationService.createNotification(notificationData);
      this.logger.log('Notification created successfully.');
      return this.jsend.success({ notification: createdNotification });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error('Error while creating notification');
      this.logger.error(JSON.stringify(error, ['message', 'stack'], 2));
      return this.jsend.error(error.message);
    }
  }

  @Get(':ids')
  @UseGuards(ApiKeyGuard)
  async getNotificationsByIds(@Param('ids') ids: string): Promise<Record<string, unknown>> {
    try {
      const idArray = ids.split(',').map((id) => +id);
      const notifications = await this.notificationService.getNotificationsByIds(idArray);
      return this.jsend.success(notifications);
    } catch (error) {
      this.logger.error(`Error while retrieving notification with IDs ${ids}`);
      this.logger.error(JSON.stringify(error, ['message', 'stack'], 2));
      return this.jsend.error(error.message);
    }
  }
}
