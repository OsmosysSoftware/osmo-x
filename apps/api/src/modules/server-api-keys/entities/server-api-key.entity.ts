import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { IsEnum } from 'class-validator';
import { Status } from 'src/common/constants/database';
import { Field, ObjectType } from '@nestjs/graphql';
import { Application } from 'src/modules/applications/entities/application.entity';

@Entity({ name: 'notify_server_api_keys' })
@ObjectType()
@Index('IDX_notify_server_api_keys_api_key', ['apiKey'], { unique: true })
@Index('IDX_notify_server_api_keys_application_id', ['applicationId'])
export class ServerApiKey {
  @PrimaryGeneratedColumn({ name: 'api_key_id' })
  @Field()
  apiKeyId: number;

  @Column({ name: 'api_key', comment: 'Hashed API key for server-to-server auth' })
  @Field()
  apiKey: string;

  @Column({ name: 'masked_api_key', comment: 'Masked display version of the API key' })
  @Field()
  maskedApiKey: string;

  @Column({ name: 'application_id', comment: 'FK to notify_applications' })
  @Field()
  applicationId: number;

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
