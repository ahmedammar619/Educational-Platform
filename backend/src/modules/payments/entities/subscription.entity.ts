import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Student } from '../../students/entities/student.entity';

@Entity('subscriptions')
export class Subscription {
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

  @Column({ name: 'stripe_subscription_id', type: 'varchar', length: 64 })
  stripeSubscriptionId: string; // e.g., "sub_12345"

  @Column({ type: 'varchar', length: 50 })
  status: string; // active, trialing, past_due, canceled, unpaid

  @Column({ name: 'current_period_start', type: 'timestamp', nullable: true })
  currentPeriodStart?: Date;

  @Column({ name: 'current_period_end', type: 'timestamp', nullable: true })
  currentPeriodEnd?: Date;

  @Column({ name: 'cancel_at', type: 'timestamp', nullable: true })
  cancelAt?: Date;

  @Column({ name: 'canceled_at', type: 'timestamp', nullable: true })
  canceledAt?: Date;

  @Column({ name: 'stripe_customer_id', type: 'varchar', length: 64, nullable: true })
  stripeCustomerId?: string;

  @Column({ name: 'stripe_price_id', type: 'varchar', length: 64, nullable: true })
  stripePriceId?: string;

  @Column({ name: 'amount', type: 'bigint', default: 0 })
  amount: number; // in cents

  @Column({ type: 'varchar', length: 10, default: 'usd' })
  currency: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
