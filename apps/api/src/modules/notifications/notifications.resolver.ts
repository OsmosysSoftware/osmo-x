import { Context, Query, Resolver } from '@nestjs/graphql';
import { NotificationsService } from './notifications.service';
import { Notification } from './entities/notification.entity';

@Resolver()
export class NotificationsResolver {
    constructor(private readonly notificationsService: NotificationsService) {}

  @Query(() => [Notification], { name: 'notifications' })
  async findAll(@Context() context) {
    return this.notificationsService.getAllNotifications();
  }
}
