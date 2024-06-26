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

@Entity({ name: 'notify_notifications' })
@ObjectType()
export class Notification {
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
  
  @ManyToOne(() => Application, (application) => application.notifications)
  @JoinColumn({ name: 'application_id' })
  @Field(() => Application)
  applicationDetails: Application;

  @ManyToOne(() => Provider, (provider) => provider.notifications)
  @JoinColumn({ name: 'provider_id' })
  @Field(() => Provider)
  providerDetails: Provider;

  constructor(notification: Partial<Notification>) {
    Object.assign(this, notification);
  }
}
