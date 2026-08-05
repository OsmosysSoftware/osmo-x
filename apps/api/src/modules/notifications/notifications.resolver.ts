import { Args, Context, Query, Resolver } from '@nestjs/graphql';
import { NotificationsService } from './notifications.service';
import { Notification } from './entities/notification.entity';
import { UseGuards } from '@nestjs/common';
import { NotificationResponse } from './dtos/notification-response.dto';
import { QueryOptionsDto } from 'src/common/graphql/dtos/query-options.dto';
import {
  JwtOrApiKeyGuard,
  RequestWithApiKeyAuth,
} from 'src/common/guards/jwt-or-api-key/jwt-or-api-key.guard';
import { SingleNotificationResponse } from './dtos/single-notification.response.dto';

@Resolver(() => Notification)
@UseGuards(JwtOrApiKeyGuard)
export class NotificationsResolver {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Query(() => NotificationResponse, { name: 'notifications' })
  async findAll(
    @Context() context: { req: RequestWithApiKeyAuth },
    @Args('options', { type: () => QueryOptionsDto, nullable: true, defaultValue: {} })
    options: QueryOptionsDto,
  ): Promise<NotificationResponse> {
    const { apiKeyApplicationId } = context.req;

    if (apiKeyApplicationId !== undefined) {
      return this.notificationsService.getAllNotificationsForApplication(
        options,
        apiKeyApplicationId,
      );
    }

    return this.notificationsService.getAllNotifications(options);
  }

  @Query(() => Notification, { name: 'notification' })
  async find(
    @Context() context: { req: RequestWithApiKeyAuth },
    @Args('notificationId') notificationId: number,
  ): Promise<SingleNotificationResponse> {
    const { apiKeyApplicationId } = context.req;

    if (apiKeyApplicationId !== undefined) {
      return this.notificationsService.findActiveOrArchivedNotificationByIdForApplication(
        notificationId,
        apiKeyApplicationId,
      );
    }

    return this.notificationsService.findActiveOrArchivedNotificationById(notificationId);
  }
}
