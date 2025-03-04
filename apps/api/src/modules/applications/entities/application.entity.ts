import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { IsEnum, IsObject, IsOptional } from 'class-validator';
import { IsEnabledStatus, Status } from 'src/common/constants/database';
import { Field, ObjectType } from '@nestjs/graphql';
import { Notification } from 'src/modules/notifications/entities/notification.entity';
import { ServerApiKey } from 'src/modules/server-api-keys/entities/server-api-key.entity';
import { ArchivedNotification } from 'src/modules/archived-notifications/entities/archived-notification.entity';
import { GraphQLJSONObject } from 'graphql-type-json';

@Entity({ name: 'notify_applications' })
@ObjectType()
export class Application {
  @PrimaryGeneratedColumn({ name: 'application_id' })
  @Field()
  applicationId: number;

  @Column({ name: 'name' })
  @Field()
  name: string;

  @Column({ name: 'user_id' })
  @Field()
  userId: number;

  @Column({
    name: 'test_mode_enabled',
    type: 'tinyint',
    width: 1,
    default: IsEnabledStatus.FALSE,
  })
  @IsEnum(IsEnabledStatus)
  @Field()
  testModeEnabled: number;

  @Column({ name: 'whitelist_recipients', type: 'json', nullable: true })
  @IsObject()
  @IsOptional()
  @Field(() => GraphQLJSONObject, { nullable: true })
  whitelistRecipients: Record<string, unknown>;

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

  @OneToMany(() => Notification, (notification) => notification.applicationDetails)
  notifications: Notification[];

  // create join for fetching data from portal
  @OneToMany(() => ServerApiKey, (serverApiKey) => serverApiKey.applicationDetails)
  serverApiKey: ServerApiKey[];

  @OneToMany(
    () => ArchivedNotification,
    (archivedNotification) => archivedNotification.applicationDetails,
  )
  archivedNotifications: ArchivedNotification[];

  constructor(application: Partial<Application>) {
    Object.assign(this, application);
  }
}
