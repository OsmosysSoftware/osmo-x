import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  CreateDateColumn,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { IsEnum, IsOptional } from 'class-validator';
import { IsDefaultStatus, ProviderType, Status } from 'src/common/constants/database';
import { Field, ObjectType } from '@nestjs/graphql';
import { Application } from 'src/modules/applications/entities/application.entity';
import { ProviderChainMember } from 'src/modules/provider-chain-members/entities/provider-chain-member.entity';
import { Notification } from 'src/modules/notifications/entities/notification.entity';
import { ArchivedNotification } from 'src/modules/archived-notifications/entities/archived-notification.entity';

@Entity({ name: 'notify_provider_chains' })
@ObjectType()
export class ProviderChain {
  @PrimaryGeneratedColumn({ name: 'chain_id' })
  @Field()
  chainId: number;

  @Column({ name: 'chain_name' })
  @Field()
  chainName: string;

  @Column({ name: 'application_id' })
  @Field()
  applicationId: number;

  @Column({ name: 'provider_type', type: 'smallint' })
  @IsEnum(ProviderType)
  @Field()
  providerType: number;

  @Column({
    name: 'description',
    type: 'text',
    nullable: true,
  })
  @IsOptional()
  @Field()
  description: string;

  @Column({
    name: 'is_default',
    type: 'smallint',
    width: 1,
    default: IsDefaultStatus.FALSE,
  })
  @IsEnum(IsDefaultStatus)
  @Field()
  isDefault: number;

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

  @ManyToOne(() => Application, (application) => application.providerChains)
  @JoinColumn({ name: 'application_id' })
  @Field(() => Application)
  applicationDetails: Application;

  @OneToMany(
    () => ProviderChainMember,
    (providerChainMember) => providerChainMember.providerChainDetails,
  )
  providerChainMembers: ProviderChainMember[];

  @OneToMany(() => Notification, (notification) => notification.providerChainDetails)
  @Field(() => [Notification], { nullable: true })
  notifications: Notification[];

  @OneToMany(
    () => ArchivedNotification,
    (archivedNotification) => archivedNotification.providerChainDetails,
  )
  @Field(() => [ArchivedNotification], { nullable: true })
  archivedNotifications: ArchivedNotification[];

  constructor(providerChain: Partial<ProviderChain>) {
    Object.assign(this, providerChain);
  }
}
