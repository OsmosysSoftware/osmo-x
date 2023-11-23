import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  CreateDateColumn,
} from 'typeorm';
import { IsEnum, IsOptional, IsObject } from 'class-validator';
import { Status } from 'src/common/constants/database';
import { ChannelType, DeliveryStatus } from 'src/common/constants/notifications';

@Entity({ name: 'notify_notifications' })
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'channel_type', type: 'tinyint', width: 1 })
  @IsEnum(ChannelType)
  channelType: number;

  @Column({ type: 'json' })
  @IsObject()
  data: Record<string, unknown>;

  @Column({
    name: 'delivery_status',
    type: 'tinyint',
    width: 1,
    default: DeliveryStatus.PENDING,
  })
  @IsEnum(DeliveryStatus)
  deliveryStatus: number;

  @Column({ type: 'json', nullable: true })
  @IsObject()
  @IsOptional()
  result: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_on' })
  createdOn: Date;

  @UpdateDateColumn({ name: 'updated_on' })
  updatedOn: Date;

  @Column({ name: 'created_by' })
  createdBy: string;

  @Column({ name: 'updated_by' })
  updatedBy: string;

  @Column({
    type: 'tinyint',
    width: 1,
    default: Status.ACTIVE,
  })
  @IsEnum(Status)
  status: number;

  constructor(notification: Partial<Notification>) {
    Object.assign(this, notification);
  }
}
