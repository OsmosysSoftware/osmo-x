import { Args, Context, Query, Resolver } from '@nestjs/graphql';
import { ArchivedNotificationsService } from './archived-notifications.service';
import { ArchivedNotification } from './entities/archived-notification.entity';
import { UseGuards } from '@nestjs/common';
import { ArchivedNotificationResponse } from './dtos/archived-notification-response.dto';
import { QueryOptionsDto } from 'src/common/graphql/dtos/query-options.dto';
import { GqlAuthGuard } from 'src/common/guards/api-key/gql-auth.guard';

@Resolver(() => ArchivedNotification)
@UseGuards(GqlAuthGuard)
export class ArchivedNotificationsResolver {
  constructor(private readonly archivedNotificationsService: ArchivedNotificationsService) {}

  @Query(() => ArchivedNotificationResponse, { name: 'archivedNotifications' })
  async findAll(
    @Context() context,
    @Args('options', { type: () => QueryOptionsDto, nullable: true, defaultValue: {} })
    options: QueryOptionsDto,
  ): Promise<ArchivedNotificationResponse> {
    return this.archivedNotificationsService.getAllArchivedNotifications(options);
  }
}
