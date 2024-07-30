import { Controller, Post, Body, Logger, HttpException, UseGuards } from '@nestjs/common';
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

  @Post('queue')
  async addNotificationsToQueue(): Promise<void> {
    this.notificationService.addNotificationsToQueue();
  }

  @Post('confirm')
  async getProviderConfirmation(): Promise<void> {
    this.notificationService.getProviderConfirmation();
  }

  @Post()
  @UseGuards(ApiKeyGuard)
  async addNotification(
    @Body() notificationData: CreateNotificationDto,
  ): Promise<Record<string, unknown>> {
    try {
      // ApiKeyGuard checks if requested providerId is valid, correct channelType and applicationId present
      this.logger.debug(`Notification Request Data: ${JSON.stringify(notificationData)}`);
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
      throw error;
    }
  }
}
