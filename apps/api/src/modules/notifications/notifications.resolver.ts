import { Args, Context, Query, Resolver } from '@nestjs/graphql';
import { NotificationsService } from './notifications.service';
import { Notification } from './entities/notification.entity';
import { UseGuards } from '@nestjs/common';
import { NotificationResponse } from './dtos/notification-response.dto';
import { QueryOptionsDto } from 'src/common/graphql/dtos/query-options.dto';
import { GqlAuthGuard } from 'src/common/guards/api-key/gql-auth.guard';

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
}
