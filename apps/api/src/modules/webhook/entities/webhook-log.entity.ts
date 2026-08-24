import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

@Entity('notify_webhook_logs')
@Index('IDX_notify_webhook_logs_webhook_id', ['webhookId'])
@Index('IDX_notify_webhook_logs_notification_id', ['notificationId'])
@Index('IDX_notify_webhook_logs_created_on', ['createdOn'])
export class WebhookLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'webhook_id', comment: 'FK to notify_webhooks' })
  webhookId: number;

  @Column({ name: 'notification_id', comment: 'FK to notify_notifications' })
  notificationId: number;

  @Column({ name: 'attempt_number' })
  attemptNumber: number;

  @Column({ type: 'smallint' })
  status: number;

  @Column({ name: 'http_status_code', type: 'int', nullable: true })
  httpStatusCode: number | null;

  @Column({ name: 'request_body', type: 'jsonb', nullable: true })
  requestBody: unknown;

  @Column({ name: 'response_body', type: 'jsonb', nullable: true })
  responseBody: unknown;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string | null;

  @Column({ name: 'requested_at', type: 'timestamptz' })
  requestedAt: Date;

  @CreateDateColumn({ name: 'created_on' })
  createdOn: Date;

  @Column({ name: 'created_by', nullable: true })
  createdBy: number | null;
}
