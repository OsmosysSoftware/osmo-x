import { Controller, Post } from '@nestjs/common';
import { ArchivedNotificationsService } from './archived-notifications.service';

@Controller('archived-notifications')
export class ArchivedNotificationsController {
  constructor(private readonly archivedNotificationService: ArchivedNotificationsService) {}

  @Post('archive')
  async addNotificationsToQueue(): Promise<void> {
    this.archivedNotificationService.archiveCompletedNotificationsCron();
  }
}
