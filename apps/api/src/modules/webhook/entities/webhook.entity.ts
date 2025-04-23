import { IsEnum } from 'class-validator';
import { Status } from 'src/common/constants/database';
import { Field, ObjectType } from '@nestjs/graphql';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('notify_webhooks')
@ObjectType()
export class Webhook {
  @PrimaryGeneratedColumn()
  @Field()
  id: number;

  @Column({ name: 'provider_id' })
  @Field()
  providerId: number;

  @Column()
  @Field()
  webhookUrl: string;

  @Column({ name: 'is_verified', default: false })
  @Field()
  isVerified: number;

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
}
