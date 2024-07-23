import {
  Controller,
  Post,
  Body,
  Logger,
  HttpException,
  UseGuards,
  InternalServerErrorException,
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
      // ApiKeyGuard checks if requested providerId is valid, correct channelType and applicationId present
      const createdNotification =
        await this.notificationService.createNotification(notificationData);
      this.logger.log('Notification created successfully.');
      return this.jsend.success({ notification: createdNotification });
    } catch (error) {
      let handledError = error;

      if (!(handledError instanceof HttpException)) {
        handledError = new InternalServerErrorException(handledError.message);
      }

      this.logger.error('Error while creating notification');
      this.logger.error(JSON.stringify(handledError, ['message', 'stack'], 2));
      throw handledError;
    }
  }
}
