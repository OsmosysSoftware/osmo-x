import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { IsEnum } from 'class-validator';
import { Status } from 'src/common/constants/database';
import { Field, ObjectType } from '@nestjs/graphql';
import { Application } from 'src/modules/applications/entities/application.entity';

@Entity({ name: 'notify_server_api_keys' })
@ObjectType()
export class ServerApiKey {
  @PrimaryGeneratedColumn({ name: 'api_key_id' })
  @Field()
  apiKeyId: number;

  @Column({ name: 'api_key' })
  @Field()
  apiKey: string;

  @Column({ name: 'masked_api_key' })
  @Field()
  maskedApiKey: string;

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
    type: 'smallint',
    width: 1,
    default: Status.ACTIVE,
  })
  @IsEnum(Status)
  @Field()
  status: number;

  @ManyToOne(() => Application, (application) => application.serverApiKey)
  @JoinColumn({ name: 'application_id' })
  @Field(() => Application)
  applicationDetails: Application;

  constructor(serverApiKey: Partial<ServerApiKey>) {
    Object.assign(this, serverApiKey);
  }
}
