import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('notify_webhooks')
export class Webhook {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'provider_id' })
  providerId: number;

  @Column()
  webhookUrl: string;

  @Column({ name: 'is_verified', default: false })
  isVerified: number;

  @CreateDateColumn({ name: 'created_on' })
  createdOn: Date;

  @UpdateDateColumn({ name: 'updated_on' })
  updatedOn: Date;
}
