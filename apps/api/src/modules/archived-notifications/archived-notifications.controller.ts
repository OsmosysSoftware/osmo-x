import { Controller, HttpException, Logger, Post } from '@nestjs/common';
import { ArchivedNotificationsService } from './archived-notifications.service';

@Controller('archived-notifications')
export class ArchivedNotificationsController {
  constructor(
    private readonly archivedNotificationService: ArchivedNotificationsService,
    private logger: Logger = new Logger(ArchivedNotificationsController.name),
  ) {}

  @Post('archive')
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
}
