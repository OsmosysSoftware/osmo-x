import { Controller, Delete, HttpException, Logger, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ArchivedNotificationsService } from './archived-notifications.service';

@ApiTags('Archived Notifications')
@Controller('archived-notifications')
export class ArchivedNotificationsController {
  constructor(
    private readonly archivedNotificationService: ArchivedNotificationsService,
    private logger: Logger = new Logger(ArchivedNotificationsController.name),
  ) {}

  @Post('archive')
  @ApiOperation({ summary: 'Archive completed notifications' })
  @ApiResponse({ status: 201, description: 'Completed notifications archived successfully' })
  @ApiResponse({ status: 500, description: 'Internal server error during archival' })
  async addNotificationsToQueue(): Promise<void> {
    try {
      this.logger.debug('Archiving completed notifications...');
      await this.archivedNotificationService.archiveCompletedNotificationsCron();
      this.logger.log('Notifications archived successfully.');
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error('Error while archiving notifications');
      this.logger.error(JSON.stringify(error, ['message', 'stack'], 2));
      throw error;
    }
  }

  @Delete('delete')
  @ApiOperation({ summary: 'Delete archived notifications' })
  @ApiResponse({ status: 200, description: 'Archived notifications deleted successfully' })
  @ApiResponse({ status: 500, description: 'Internal server error during deletion' })
  async deleteArchivedNotifications(): Promise<void> {
    try {
      this.logger.debug('Deleting archived notifications...');
      await this.archivedNotificationService.deleteArchivedNotificationsCron();
      this.logger.log('End of delete archived notifications Cron');
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error('Error while deleting notifications');
      this.logger.error(JSON.stringify(error, ['message', 'stack'], 2));
      throw error;
    }
  }
}
