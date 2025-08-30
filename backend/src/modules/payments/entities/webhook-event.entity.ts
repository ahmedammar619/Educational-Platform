import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('webhook_events')
export class WebhookEvent {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ name: 'stripe_event_id', type: 'varchar', length: 64, unique: true })
  stripeEventId: string; // e.g., "evt_12345"

  @Column({ type: 'varchar', length: 100 })
  type: string; // e.g., "invoice.payment_succeeded"

  @Column({ type: 'jsonb' })
  payload: any; // raw Stripe event

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
