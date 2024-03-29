import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Notification } from '../entities/notification.entity';

@ObjectType()
export class NotificationResponse {
  @Field(() => [Notification])
  notifications: Notification[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  offset: number;

  @Field(() => Int)
  limit: number;

  constructor(items: Notification[], total: number, offset?: number, limit?: number) {
    this.notifications = items;
    this.total = total;
    this.offset = offset ?? 0;
    this.limit = limit ?? items.length;
  }
}
