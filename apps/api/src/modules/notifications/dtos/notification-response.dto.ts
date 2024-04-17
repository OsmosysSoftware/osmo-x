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
}
