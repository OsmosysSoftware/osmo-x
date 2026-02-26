import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Notification } from './notification.entity';

@Entity('notify_notification_retries')
@Index('IDX_notify_notification_retries_notification_id', ['notification_id'])
export class RetryNotification {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Notification, (notification) => notification.retries)
  @JoinColumn({ name: 'notification_id' })
  notification: Notification;

  @Column()
  notification_id: number;

  @Column({ name: 'retry_count' })
  retryCount: number;

  @Column('jsonb', { name: 'retry_result', nullable: true })
  retryResult: string;

  @Column({ type: 'smallint', default: 1 })
  status: number;

  @CreateDateColumn({ name: 'created_on' })
  createdOn: Date;

  @UpdateDateColumn({ name: 'modified_on' })
  modifiedOn: Date;

  @Column({ name: 'created_by', type: 'varchar', length: 255, nullable: true })
  createdBy: string;

  @Column({ name: 'modified_by', type: 'varchar', length: 255, nullable: true })
  modifiedBy: string;
}
