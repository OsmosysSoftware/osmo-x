import { Args, Query, Resolver } from '@nestjs/graphql';
import { NotificationsService } from './notifications.service';
import { Notification } from './entities/notification.entity';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ApiKeyGuard } from 'src/common/guards/api-key/api-key.guard';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { UseGuards } from '@nestjs/common';
import { NotificationResponse } from './dtos/notification-response.dto';
import { QueryOptionsDto } from './dtos/query-options.dto';

@Resolver(() => Notification)
// @UseGuards(ApiKeyGuard)
export class NotificationsResolver {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Query(() => NotificationResponse, { name: 'notifications' })
  async findAll(
    @Args('options', { type: () => QueryOptionsDto, nullable: true, defaultValue: {} })
    options: QueryOptionsDto,
  ): Promise<NotificationResponse> {
    return this.notificationsService.getAllNotifications(options);
  }
}
