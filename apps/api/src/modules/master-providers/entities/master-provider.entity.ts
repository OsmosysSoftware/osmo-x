import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  CreateDateColumn,
} from 'typeorm';
import { IsEnum } from 'class-validator';
import { ProviderType, Status } from 'src/common/constants/database';
import { Field, ObjectType } from '@nestjs/graphql';

@Entity({ name: 'notify_master_providers' })
@ObjectType()
export class MasterProvider {
  @PrimaryGeneratedColumn({ name: 'master_id' })
  @Field()
  masterId: number;

  @Column({ name: 'name' })
  @Field()
  name: string;

  @Column({ name: 'provider_type', type: 'smallint' })
  @IsEnum(ProviderType)
  @Field()
  providerType: number;

  @Column('jsonb', { name: 'configuration' })
  @Field()
  configuration: string;

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
}
