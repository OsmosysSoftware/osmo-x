import { Args, Context, Query, Resolver } from '@nestjs/graphql';
import { ArchivedNotificationsService } from './archived-notifications.service';
import { ArchivedNotification } from './entities/archived-notification.entity';
import { UseGuards } from '@nestjs/common';
import { ArchivedNotificationResponse } from './dtos/archived-notification-response.dto';
import { QueryOptionsDto } from 'src/common/graphql/dtos/query-options.dto';
import {
  JwtOrApiKeyGuard,
  RequestWithApiKeyAuth,
} from 'src/common/guards/jwt-or-api-key/jwt-or-api-key.guard';

@Resolver(() => ArchivedNotification)
@UseGuards(JwtOrApiKeyGuard)
export class ArchivedNotificationsResolver {
  constructor(private readonly archivedNotificationsService: ArchivedNotificationsService) {}

  @Query(() => ArchivedNotificationResponse, { name: 'archivedNotifications' })
  async findAll(
    @Context() context: { req: RequestWithApiKeyAuth },
    @Args('options', { type: () => QueryOptionsDto, nullable: true, defaultValue: {} })
    options: QueryOptionsDto,
  ): Promise<ArchivedNotificationResponse> {
    const { apiKeyApplicationId } = context.req;

    if (apiKeyApplicationId !== undefined) {
      return this.archivedNotificationsService.getAllArchivedNotificationsForApplication(
        options,
        apiKeyApplicationId,
      );
    }

    return this.archivedNotificationsService.getAllArchivedNotifications(options);
  }
}
