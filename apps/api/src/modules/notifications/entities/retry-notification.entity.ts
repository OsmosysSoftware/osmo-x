import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Notification } from './notification.entity';

@Entity('notify_notification_retries')
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

  @Column('longtext', { name: 'retry_result', nullable: true })
  retryResult: string;

  @Column({ type: 'tinyint', default: 1 })
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
