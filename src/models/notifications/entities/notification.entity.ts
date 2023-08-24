import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'notifications' })
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'channel_type' })
  channelType: string;

  @Column({ type: 'json' })
  data: string;

  @Column({ name: 'delivery_status', width: 1, default: 1 })
  deliveryStatus: number;

  @Column({ type: 'json', nullable: true })
  result: string;

  @Column({ name: 'created_by' })
  createdBy: string;

  @Column({ name: 'created_on' })
  createdOn: Date;

  @Column({ name: 'modified_by', nullable: true })
  modifiedBy: string;

  @Column({ name: 'modified_on', nullable: true })
  modifiedOn: Date;
}
