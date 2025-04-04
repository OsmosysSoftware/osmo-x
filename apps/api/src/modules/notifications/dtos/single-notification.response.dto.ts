import { ObjectType, Field } from '@nestjs/graphql';
import { Column, CreateDateColumn, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { IsEnum, IsObject, IsOptional } from 'class-validator';
import { GraphQLJSONObject } from 'graphql-type-json';
import { ChannelType, DeliveryStatus } from 'src/common/constants/notifications';
import { Status } from 'src/common/constants/database';
import { Notification } from '../entities/notification.entity';
import { ArchivedNotification } from 'src/modules/archived-notifications/entities/archived-notification.entity';

@ObjectType()
export class SingleNotificationResponse {
  @PrimaryGeneratedColumn()
  @Field()
  id: number;

  @Column({ name: 'provider_id', default: null })
  @Field()
  providerId: number;

  @Column({ name: 'channel_type', type: 'tinyint', width: 1, default: null })
  @IsEnum(ChannelType)
  @Field()
  channelType: number;

  @Column({ type: 'json' })
  @IsObject()
  @Field(() => GraphQLJSONObject)
  data: Record<string, unknown>;

  @Column({
    name: 'delivery_status',
    type: 'tinyint',
    width: 1,
    default: DeliveryStatus.PENDING,
  })
  @IsEnum(DeliveryStatus)
  @Field()
  deliveryStatus: number;

  @Column({ type: 'json', nullable: true })
  @IsObject()
  @IsOptional()
  @Field(() => GraphQLJSONObject, { nullable: true })
  result: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_on' })
  @Field()
  createdOn: Date;

  @UpdateDateColumn({ name: 'updated_on' })
  @Field()
  updatedOn: Date;

  @Column({ name: 'created_by' })
  @Field()
  createdBy: string;

  @Column({ name: 'updated_by' })
  @Field()
  updatedBy: string;

  @Column({
    type: 'tinyint',
    width: 1,
    default: Status.ACTIVE,
  })
  @IsEnum(Status)
  @Field()
  status: number;

  @Column({ name: 'application_id', default: null })
  @Field()
  applicationId: number;

  @Column({ name: 'retry_count', type: 'int', default: 0 })
  @Field()
  retryCount: number;

  @Column({ name: 'notification_sent_on', nullable: true })
  @Field({ nullable: true })
  @IsOptional()
  notificationSentOn: Date;

  // Constructor that builds response using Notification or ArchivedNotification
  constructor(notificationEntry: Notification | ArchivedNotification) {
    this.id =
      (notificationEntry as Notification).id ||
      (notificationEntry as ArchivedNotification).notificationId;
    this.providerId = notificationEntry.providerId;
    this.channelType = notificationEntry.channelType;
    this.data = notificationEntry.data;
    this.deliveryStatus = notificationEntry.deliveryStatus;
    this.result = notificationEntry.result;
    this.createdOn = notificationEntry.createdOn;
    this.updatedOn = notificationEntry.updatedOn;
    this.createdBy = notificationEntry.createdBy;
    this.updatedBy = notificationEntry.updatedBy;
    this.status = notificationEntry.status;
    this.applicationId = notificationEntry.applicationId;
    this.retryCount = notificationEntry.retryCount;
    this.notificationSentOn = notificationEntry.notificationSentOn || null;
  }
}
