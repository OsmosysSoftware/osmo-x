import { Controller, Post, Body, Logger, HttpException, UseGuards, Query } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dtos/create-notification.dto';
import { JsendFormatter } from 'src/common/jsend-formatter';
import { ApiKeyGuard } from 'src/common/guards/api-key/api-key.guard';
import { QueueService } from './queues/queue.service';

@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationService: NotificationsService,
    private readonly queueService: QueueService,
    private readonly jsend: JsendFormatter,
    private logger: Logger = new Logger(NotificationsController.name),
  ) {}

  @Post('queue')
  async addNotificationsToQueue(): Promise<void> {
    this.notificationService.addNotificationsToQueue();
  }

  @Post('confirm')
  async getProviderConfirmation(): Promise<void> {
    this.notificationService.getProviderConfirmation();
  }

  @Post('redis/cleanup')
  async cleanupRedisJobs(
    @Query('gracePeriod') gracePeriod?: string,
  ): Promise<Record<string, unknown>> {
    try {
      const grace = gracePeriod ? parseInt(gracePeriod, 10) : 0;

      if (isNaN(grace) || grace < 0) {
        return this.jsend.fail({
          message: 'Invalid gracePeriod parameter. Must be a positive number in milliseconds.',
        });
      }

      this.logger.log(`Starting Redis job cleanup with grace period: ${grace}ms`);
      const result = await this.queueService.cleanupCompletedAndFailedJobs(grace);

      return this.jsend.success({
        message: 'Redis job cleanup completed successfully',
        summary: {
          totalCompletedJobsRemoved: result.totalCompleted,
          totalFailedJobsRemoved: result.totalFailed,
          totalJobsRemoved: result.totalCompleted + result.totalFailed,
          queuesProcessed: result.queues.length,
        },
        details: result.queues,
      });
    } catch (error) {
      this.logger.error('Error during Redis job cleanup');
      this.logger.error(JSON.stringify(error, ['message', 'stack'], 2));

      if (error instanceof HttpException) {
        throw error;
      }

      return this.jsend.error({
        message: 'Failed to cleanup Redis jobs',
        error: error.message,
      });
    }
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
