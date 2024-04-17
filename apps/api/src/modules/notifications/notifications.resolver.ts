import { Args, Context, Query, Resolver } from '@nestjs/graphql';
import { NotificationsService } from './notifications.service';
import { Notification } from './entities/notification.entity';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ApiKeyGuard } from 'src/common/guards/api-key/api-key.guard';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { UseGuards } from '@nestjs/common';
import { NotificationResponse } from './dtos/notification-response.dto';
import { QueryOptionsDto } from 'src/common/graphql/dtos/query-options.dto';

@Resolver(() => Notification)
@UseGuards(ApiKeyGuard)
export class NotificationsResolver {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Query(() => NotificationResponse, { name: 'notifications' })
  async findAll(
    @Context() context,
    @Args('options', { type: () => QueryOptionsDto, nullable: true, defaultValue: {} })
    options: QueryOptionsDto,
  ): Promise<NotificationResponse> {
    const request: Request = context.req;
    const authorizationHeader = request.headers['authorization'];
    return this.notificationsService.getAllNotifications(options, authorizationHeader);
  }
}
