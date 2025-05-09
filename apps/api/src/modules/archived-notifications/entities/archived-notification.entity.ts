import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { IsEnum, IsOptional, IsObject } from 'class-validator';
import { Status } from 'src/common/constants/database';
import { ChannelType, DeliveryStatus } from 'src/common/constants/notifications';
import { Field, ObjectType } from '@nestjs/graphql';
import { GraphQLJSONObject } from 'graphql-type-json';
import { Application } from 'src/modules/applications/entities/application.entity';
import { Provider } from 'src/modules/providers/entities/provider.entity';

@Entity({ name: 'notify_archived_notifications' })
@ObjectType()
export class ArchivedNotification {
  @PrimaryGeneratedColumn()
  @Field()
  id: number;

  @Column({ name: 'notification_id' })
  @Field()
  notificationId: number;

  @Column({ name: 'provider_id', default: null })
  @Field()
  providerId: number;

  @Column({ name: 'channel_type', type: 'smallint', width: 1, default: null })
  @IsEnum(ChannelType)
  @Field()
  channelType: number;

  @Column({ type: 'json' })
  @IsObject()
  @Field(() => GraphQLJSONObject)
  data: Record<string, unknown>;

  @Column({
    name: 'delivery_status',
    type: 'smallint',
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
    type: 'smallint',
    width: 1,
    default: Status.ACTIVE,
  })
  @IsEnum(Status)
  @Field()
  status: number;

  @Column({ name: 'application_id', default: null })
  @Field()
  applicationId: number;

  @Column({ name: 'retry_count', type: 'integer', default: 0 })
  @Field()
  retryCount: number;

  @Column({ name: 'notification_sent_on', nullable: true })
  @Field({ nullable: true })
  @IsOptional()
  notificationSentOn: Date;

  @ManyToOne(() => Application, (application) => application.archivedNotifications)
  @JoinColumn({ name: 'application_id' })
  @Field(() => Application)
  applicationDetails: Application;

  @ManyToOne(() => Provider, (provider) => provider.archivedNotifications)
  @JoinColumn({ name: 'provider_id' })
  @Field(() => Provider)
  providerDetails: Provider;
}
