import { IsEnum } from 'class-validator';
import { Status } from 'src/common/constants/database';
import { Field, ObjectType } from '@nestjs/graphql';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('notify_webhooks')
@ObjectType()
@Index('IDX_notify_webhooks_provider_id', ['providerId'])
export class Webhook {
  @PrimaryGeneratedColumn()
  @Field()
  id: number;

  @Column({ name: 'provider_id', comment: 'FK to notify_providers' })
  @Field()
  providerId: number;

  @Column({ name: 'webhook_url' })
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

  @Column({ name: 'created_by', nullable: true })
  @Field({ nullable: true })
  createdBy: number;

  @Column({ name: 'updated_by', nullable: true })
  @Field({ nullable: true })
  updatedBy: number;

  @Column({
    type: 'smallint',
    width: 1,
    default: Status.ACTIVE,
  })
  @IsEnum(Status)
  @Field()
  status: number;
}
