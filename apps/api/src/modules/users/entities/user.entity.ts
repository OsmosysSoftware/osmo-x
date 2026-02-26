import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { IsEnum } from 'class-validator';
import { Status, UserRoles } from 'src/common/constants/database';
import { Field, ObjectType } from '@nestjs/graphql';

@Entity({ name: 'notify_users' })
@ObjectType()
@Index('IDX_notify_users_username', ['username'], { unique: true })
export class User {
  @PrimaryGeneratedColumn({ name: 'user_id' })
  @Field()
  userId: number;

  @Column({ name: 'username', comment: 'Unique login username' })
  @Field()
  username: string;

  @Column({ name: 'password', comment: 'Bcrypt hashed password' })
  @Field()
  password: string;

  @Column({
    name: 'role',
    type: 'smallint',
    width: 1,
    default: UserRoles.BASIC,
    comment: '0=Basic, 1=Admin',
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
    type: 'smallint',
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
