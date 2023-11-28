import { Query, Resolver } from '@nestjs/graphql';
import { NotificationsService } from './notifications.service';
import { Notification } from './entities/notification.entity';

@Resolver()
export class NotificationsResolver {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Query(() => [Notification], { name: 'notifications' })
  async findAll(): Promise<Notification[]> {
    return this.notificationsService.getAllNotifications();
  }
}
