import { ObjectType, Field, Int } from '@nestjs/graphql';
import { ArchivedNotification } from '../entities/archived-notification.entity';

@ObjectType()
export class ArchivedNotificationResponse {
  @Field(() => [ArchivedNotification])
  archivedNotifications: ArchivedNotification[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  offset: number;

  @Field(() => Int)
  limit: number;

  constructor(items: ArchivedNotification[], total: number, offset?: number, limit?: number) {
    this.archivedNotifications = items;
    this.total = total;
    this.offset = offset ?? 0;
    this.limit = limit ?? items.length;
  }
}
