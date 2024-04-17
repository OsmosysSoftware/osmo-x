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
export class ServerApiKey {
  @PrimaryGeneratedColumn({ name: 'api_key_id' })
  @Field()
  apiKeyId: number;

  @Column({ name: 'api_key' })
  @Field()
  apiKey: string;

  @Column({ name: 'application_id' })
  @Field()
  applicationId: number;

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

  constructor(serverApiKey: Partial<ServerApiKey>) {
    Object.assign(this, serverApiKey);
  }
}
