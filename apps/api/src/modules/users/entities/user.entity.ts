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
import { IsEnum, IsOptional } from 'class-validator';
import { Status, UserRoles } from 'src/common/constants/database';
import { Field, ObjectType } from '@nestjs/graphql';
import { Organization } from 'src/modules/organizations/entities/organization.entity';

@Entity({ name: 'notify_users' })
@ObjectType()
@Index('IDX_notify_users_username', ['username'], { unique: true })
@Index('IDX_notify_users_email', ['email'], { unique: true })
@Index('IDX_notify_users_organization_id', ['organizationId'])
export class User {
  @PrimaryGeneratedColumn({ name: 'user_id' })
  @Field()
  userId: number;

  @Column({ name: 'username', comment: 'Kept for GraphQL backward compat, set to email' })
  @Field()
  username: string;

  @Column({ name: 'password', comment: 'Bcrypt hashed password' })
  @Field()
  password: string;

  @Column({
    name: 'email',
    comment: 'Unique login identifier (normalized lowercase)',
  })
  @Field()
  email: string;

  @Column({ name: 'first_name', nullable: true, comment: 'User first name' })
  @IsOptional()
  @Field({ nullable: true })
  firstName: string;

  @Column({ name: 'last_name', nullable: true, comment: 'User last name' })
  @IsOptional()
  @Field({ nullable: true })
  lastName: string;

  @Column({
    name: 'role',
    type: 'smallint',
    width: 1,
    default: UserRoles.ORG_USER,
    comment: '0=OrgUser, 1=OrgAdmin, 2=SuperAdmin',
  })
  @IsEnum(UserRoles)
  @Field()
  userRole: number;

  @Column({
    name: 'organization_id',
    nullable: true,
    comment: 'FK to notify_organizations',
  })
  @Field({ nullable: true })
  organizationId: number;

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

  @ManyToOne(() => Organization, (organization) => organization.users)
  @JoinColumn({ name: 'organization_id' })
  organizationDetails: Organization;

  constructor(user: Partial<User>) {
    Object.assign(this, user);
  }
}
