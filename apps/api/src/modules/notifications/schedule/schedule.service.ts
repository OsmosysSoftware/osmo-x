import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationsService } from '../notifications.service';

@Injectable()
export class ScheduleService {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Cron(CronExpression.EVERY_SECOND)
  async addNotificationsToQueue(): Promise<void> {
    this.notificationsService.addNotificationsToQueue();
  }

  @Cron(CronExpression.EVERY_SECOND)
  async getProviderConfirmation(): Promise<void> {
    this.notificationsService.getProviderConfirmation();
  }
}
