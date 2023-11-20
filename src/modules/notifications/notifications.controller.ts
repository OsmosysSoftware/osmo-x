import {
  Controller,
  Post,
  Body,
  Logger,
  HttpException,
  UseGuards,
  Get,
  Param,
  NotFoundException,
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

  @Get(':id(\\d+)')
  @UseGuards(ApiKeyGuard)
  async getNotificationById(@Param('id') id: number): Promise<Record<string, unknown>> {
    try {
      const notification = await this.notificationService.getNotificationById(+id);

      if (!notification || notification.length === 0) {
        this.logger.error(`Notification with id ${id} not found`);
        throw new NotFoundException(`Notification with id ${id} not found`);
      }

      return this.jsend.success({ notification: notification[0] });
    } catch (error) {
      this.logger.error(`Error while retrieving notification with ID ${id}`);
      this.logger.error(JSON.stringify(error, ['message', 'stack'], 2));
      return this.jsend.error(error.message);
    }
  }
}
