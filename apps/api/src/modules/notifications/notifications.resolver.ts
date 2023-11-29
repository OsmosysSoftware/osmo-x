import { Query, Resolver } from '@nestjs/graphql';
import { NotificationsService } from './notifications.service';
import { Notification } from './entities/notification.entity';
import { ApiKeyGuard } from 'src/common/guards/api-key/api-key.guard';
import { UseGuards } from '@nestjs/common';

@Resolver(() => Notification)
@UseGuards(ApiKeyGuard)
export class NotificationsResolver {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Query(() => [Notification], { name: 'notifications' })
  async findAll(): Promise<Notification[]> {
    return this.notificationsService.getAllNotifications();
  }
}
