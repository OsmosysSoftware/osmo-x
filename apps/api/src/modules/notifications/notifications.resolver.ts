import { Args, Context, Query, Resolver } from '@nestjs/graphql';
import { NotificationsService } from './notifications.service';
import { Notification } from './entities/notification.entity';
import { UseGuards } from '@nestjs/common';
import { NotificationResponse } from './dtos/notification-response.dto';
import { QueryOptionsDto } from 'src/common/graphql/dtos/query-options.dto';
import { GqlAuthGuard } from 'src/common/guards/gql-auth.guard';
import { SingleNotificationResponse } from './dtos/single-notification.response.dto';

@Resolver(() => Notification)
@UseGuards(GqlAuthGuard)
export class NotificationsResolver {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Query(() => NotificationResponse, { name: 'notifications' })
  async findAll(
    @Context() context,
    @Args('options', { type: () => QueryOptionsDto, nullable: true, defaultValue: {} })
    options: QueryOptionsDto,
  ): Promise<NotificationResponse> {
    return this.notificationsService.getAllNotifications(options);
  }

  @Query(() => Notification, { name: 'notification' })
  async find(@Args('notificationId') notificationId: number): Promise<SingleNotificationResponse> {
    return this.notificationsService.findActiveOrArchivedNotificationById(notificationId);
  }
}
