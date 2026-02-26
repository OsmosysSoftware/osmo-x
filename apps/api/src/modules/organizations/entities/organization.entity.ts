import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  CreateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { IsEnum } from 'class-validator';
import { Status } from 'src/common/constants/database';
import { Field, ObjectType } from '@nestjs/graphql';
import { User } from 'src/modules/users/entities/user.entity';
import { Application } from 'src/modules/applications/entities/application.entity';

@Entity({ name: 'notify_organizations' })
@ObjectType()
@Index('IDX_notify_organizations_slug', ['slug'], { unique: true })
export class Organization {
  @PrimaryGeneratedColumn({ name: 'organization_id' })
  @Field()
  organizationId: number;

  @Column({ name: 'name' })
  @Field()
  name: string;

  @Column({ name: 'slug', unique: true })
  @Field()
  slug: string;

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

  @OneToMany(() => User, (user) => user.organizationDetails)
  users: User[];

  @OneToMany(() => Application, (application) => application.organizationDetails)
  applications: Application[];

  constructor(organization: Partial<Organization>) {
    Object.assign(this, organization);
  }
}
