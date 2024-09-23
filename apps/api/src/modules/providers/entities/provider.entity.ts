import { ObjectType, Field } from '@nestjs/graphql';
import { IsEnum } from 'class-validator';
import { IsEnabledStatus, Status } from 'src/common/constants/database';
import { ChannelType } from 'src/common/constants/notifications';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Notification } from 'src/modules/notifications/entities/notification.entity';

@Entity({ name: 'notify_providers' })
@ObjectType()
export class Provider {
  @PrimaryGeneratedColumn({ name: 'provider_id' })
  @Field()
  providerId: number;

  @Column({ name: 'name' })
  @Field()
  name: string;

  @Column({ name: 'channel_type', type: 'tinyint', width: 1 })
  @IsEnum(ChannelType)
  @Field()
  channelType: number;

  @Column({
    name: 'is_enabled',
    type: 'tinyint',
    width: 1,
    default: IsEnabledStatus.TRUE,
  })
  @IsEnum(IsEnabledStatus)
  @Field()
  isEnabled: number;

  @Column({ name: 'configuration' })
  @Field()
  configuration: string;

  @Column({ name: 'application_id' })
  @Field()
  applicationId: number;

  @Column({ name: 'user_id' })
  @Field()
  userId: number;

  @CreateDateColumn({ name: 'created_on' })
  @Field()
  createdOn: Date;

  @UpdateDateColumn({ name: 'updated_on' })
  @Field()
  updatedOn: Date;

  @Column({
    name: 'status',
    type: 'tinyint',
    width: 1,
    default: Status.ACTIVE,
  })
  @IsEnum(Status)
  @Field()
  status: number;

  @OneToMany(() => Notification, (notification) => notification.providerDetails)
  notifications: Notification[];

  constructor(provider: Partial<Provider>) {
    Object.assign(this, provider);
  }
}
