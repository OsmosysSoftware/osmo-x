import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { IsEnum } from 'class-validator';
import { Status } from 'src/common/constants/database';
import { Field, ObjectType } from '@nestjs/graphql';
import { Notification } from 'src/modules/notifications/entities/notification.entity';

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

  constructor(application: Partial<Application>) {
    Object.assign(this, application);
  }
}
