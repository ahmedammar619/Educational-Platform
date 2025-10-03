import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Student } from '../../students/entities/student.entity';
import { SubscriptionPlan } from './subscription-plan.entity';
import { Payment } from './payment.entity';
import { Course } from '../../courses/entities/course.entity';

export enum SubscriptionStatus {
  ACTIVE = 'active',
  TRIALING = 'trialing',
  PAST_DUE = 'past_due',
  CANCELED = 'canceled',
  INCOMPLETE = 'incomplete',
  INCOMPLETE_EXPIRED = 'incomplete_expired',
  UNPAID = 'unpaid',
  PAUSED = 'paused'
}

@Entity('student_subscriptions')
export class StudentSubscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Parent/payer
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  // Student
  @Column({ name: 'student_id', type: 'uuid' })
  studentId: string;

  // Subscription plan
  @Column({ name: 'plan_id', type: 'uuid' })
  planId: string;

  @Column({ name: 'student_name', type: 'varchar', length: 255, nullable: true })
  studentName: string;

  @Column({ name: 'plan_name', type: 'varchar', length: 255 })
  planName: string;

  // Stripe IDs
  @Column({ name: 'stripe_subscription_id', type: 'varchar', length: 64, nullable: true })
  stripeSubscriptionId: string;

  @Column({ name: 'stripe_customer_id', type: 'varchar', length: 64, nullable: true })
  stripeCustomerId: string;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.INCOMPLETE
  })
  status: SubscriptionStatus;

  @Column({ name: 'current_period_start', type: 'timestamp', nullable: true })
  currentPeriodStart: Date;

  @Column({ name: 'current_period_end', type: 'timestamp', nullable: true })
  currentPeriodEnd: Date;

  @Column({ name: 'cancel_at', type: 'timestamp', nullable: true })
  cancelAt: Date;

  @Column({ name: 'canceled_at', type: 'timestamp', nullable: true })
  canceledAt: Date;

  @Column({ type: 'bigint', default: 0 })
  amount: number;

  @Column({ type: 'varchar', length: 10, default: 'usd' })
  currency: string;

  // For one-time payments, track if it's been paid
  @Column({ name: 'is_paid', type: 'boolean', default: false })
  isPaid: boolean;

  @Column({ name: 'paid_at', type: 'timestamp', nullable: true })
  paidAt: Date;

  // Admin notes
  @Column({ type: 'text', nullable: true })
  notes: string;

  // Course enrollment tracking
  @Column({ name: 'is_enrolled', type: 'boolean', default: false })
  isEnrolled: boolean;

  @Column({ name: 'enrolled_at', type: 'timestamp', nullable: true })
  enrolledAt: Date;

  @Column({ name: 'course_id', type: 'uuid', nullable: true })
  courseId: string;

  @Column({ name: 'enrollment_status', type: 'varchar', length: 50, default: 'pending' })
  enrollmentStatus: string; // pending, enrolled, completed, dropped

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @ManyToOne(() => SubscriptionPlan)
  @JoinColumn({ name: 'plan_id' })
  plan: SubscriptionPlan;

  @ManyToOne(() => Course, { nullable: true })
  @JoinColumn({ name: 'course_id' })
  course: Course;

  @OneToMany(() => Payment, payment => payment.studentSubscription)
  payments: Payment[];
}
