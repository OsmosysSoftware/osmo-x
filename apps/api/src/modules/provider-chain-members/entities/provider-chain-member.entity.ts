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
import { ProviderChain } from 'src/modules/provider-chains/entities/provider-chain.entity';
import { Provider } from 'src/modules/providers/entities/provider.entity';

@Entity({ name: 'notify_provider_chain_members' })
@ObjectType()
export class ProviderChainMember {
  @PrimaryGeneratedColumn({ name: 'id' })
  @Field()
  id: number;

  @Column({ name: 'chain_id' })
  @Field()
  chainId: number;

  @Column({ name: 'provider_id' })
  @Field()
  providerId: number;

  @Column({ name: 'priority_order', type: 'smallint' })
  @Field()
  priorityOrder: number;

  @Column({
    name: 'is_active',
    type: 'smallint',
    default: Status.ACTIVE,
  })
  @IsEnum(Status)
  @Field()
  isActive: number;

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

  @ManyToOne(() => ProviderChain, (providerChain) => providerChain.providerChainMembers)
  @JoinColumn({ name: 'chain_id' })
  @Field(() => ProviderChain)
  providerChainDetails: ProviderChain;

  @ManyToOne(() => Provider, (provider) => provider.providerChainMembers)
  @JoinColumn({ name: 'provider_id' })
  @Field(() => Provider)
  providerDetails: Provider;

  constructor(providerChainMember: Partial<ProviderChainMember>) {
    Object.assign(this, providerChainMember);
  }
}
