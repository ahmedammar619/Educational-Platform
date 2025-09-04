import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Student } from '../../students/entities/student.entity';
import { Subscription } from './subscription.entity';

@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'student_id', type: 'uuid' })
  studentId: string;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @Column({ name: 'subscription_id', type: 'bigint', nullable: true })
  subscriptionId?: string;

  @ManyToOne(() => Subscription, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'subscription_id' })
  subscription?: Subscription;

  @Column({ name: 'stripe_invoice_id', type: 'varchar', length: 64 })
  stripeInvoiceId: string; // e.g., "in_12345"

  @Column({ name: 'stripe_subscription_id', type: 'varchar', length: 64, nullable: true })
  stripeSubscriptionId?: string;

  @Column({ name: 'amount_paid', type: 'bigint' })
  amountPaid: number; // in cents

  @Column({ type: 'varchar', length: 10 })
  currency: string; // e.g., "usd"

  @Column({ type: 'varchar', length: 50 })
  status: string; // paid, open, void, uncollectible

  @Column({ name: 'paid_at', type: 'timestamp', nullable: true })
  paidAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
