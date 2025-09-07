import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Student } from '../../students/entities/student.entity';
import { Invoice } from './invoice.entity';

@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'student_id', type: 'uuid' })
  studentId: string;

  @Column({ name: 'student_name', type: 'varchar', length: 255, nullable: true })
  studentName?: string;

  @Column({ name: 'stripe_subscription_id', type: 'varchar', length: 64, nullable: true })
  stripeSubscriptionId?: string;

  @Column({ name: 'stripe_customer_id', type: 'varchar', length: 64, nullable: true })
  stripeCustomerId?: string;

  @Column({ type: 'varchar', length: 50 })
  status: string;

  @Column({ name: 'current_period_start', type: 'timestamp', nullable: true })
  currentPeriodStart?: Date;

  @Column({ name: 'current_period_end', type: 'timestamp', nullable: true })
  currentPeriodEnd?: Date;

  @Column({ name: 'cancel_at', type: 'timestamp', nullable: true })
  cancelAt?: Date;

  @Column({ name: 'canceled_at', type: 'timestamp', nullable: true })
  canceledAt?: Date;

  @Column({ type: 'bigint', default: 0 })
  amount: number;

  @Column({ type: 'varchar', length: 10, default: 'usd' })
  currency: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Student)
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @OneToMany(() => Invoice, invoice => invoice.subscription)
  invoices: Invoice[];
}
