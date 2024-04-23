import { ObjectType, Field } from '@nestjs/graphql';
import { IsEnum, IsObject } from 'class-validator';
import { GraphQLJSONObject } from 'graphql-type-json';
import { Status } from 'src/common/constants/database';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'notify_providers' })
@ObjectType()
export class Provider {
  @PrimaryGeneratedColumn({ name: 'provider_id' })
  @Field()
  providerId: number;

  @Column({ name: 'name' })
  @Field()
  name: string;

  @Column({ name: 'configuration', type: 'json' })
  @IsObject()
  @Field(() => GraphQLJSONObject)
  configuration: string;

  @Column({ name: 'application_id' })
  @Field()
  applicationId: number;

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

  constructor(provider: Partial<Provider>) {
    Object.assign(this, provider);
  }
}
