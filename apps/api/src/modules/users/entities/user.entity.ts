import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  CreateDateColumn,
} from 'typeorm';
import { IsEnum } from 'class-validator';
import { Status, UserRoles } from 'src/common/constants/database';
import { Field, ObjectType } from '@nestjs/graphql';

@Entity({ name: 'notify_users' })
@ObjectType()
export class User {
  @PrimaryGeneratedColumn({ name: 'user_id' })
  @Field()
  userId: number;

  @Column({ name: 'username' })
  @Field()
  username: string;

  @Column({ name: 'password' })
  @Field()
  password: string;

  @Column({
    name: 'role',
    type: 'tinyint',
    width: 1,
    default: UserRoles.BASIC,
  })
  @IsEnum(UserRoles)
  @Field()
  userRole: number;

  @CreateDateColumn({ name: 'created_on' })
  @Field()
  createdOn: Date;

  @UpdateDateColumn({ name: 'updated_on' })
  @Field()
  updatedOn: Date;

  @Column({
    type: 'tinyint',
    width: 1,
    default: Status.ACTIVE,
  })
  @IsEnum(Status)
  @Field()
  status: number;

  constructor(user: Partial<User>) {
    Object.assign(this, user);
  }
}
