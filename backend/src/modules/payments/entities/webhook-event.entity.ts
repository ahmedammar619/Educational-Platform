import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('webhook_events')
export class WebhookEvent {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ name: 'stripe_event_id', type: 'varchar', length: 64, unique: true })
  stripeEventId: string;

  @Column({ type: 'varchar', length: 100 })
  type: string;

  @Column({ type: 'jsonb' })
  payload: any;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
