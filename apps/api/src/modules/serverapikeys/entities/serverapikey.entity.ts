import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  CreateDateColumn,
} from 'typeorm';
import { IsEnum } from 'class-validator';
import { Status } from 'src/common/constants/database';
import { Field, ObjectType } from '@nestjs/graphql';

@Entity({ name: 'notify_server_api_keys' })
@ObjectType()
export class Serverapikey {
  @PrimaryGeneratedColumn({ name: 'application_id' })
  @Field()
  applicationId: number;

  @Column({ name: 'api_key' })
  @Field()
  apiKey: string;

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

  constructor(serverApiKey: Partial<Serverapikey>) {
    Object.assign(this, serverApiKey);
  }
}
