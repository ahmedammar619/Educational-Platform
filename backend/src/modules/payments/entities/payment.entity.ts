import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Student } from '../../students/entities/student.entity';
import { StudentSubscription } from './student-subscription.entity';
import { SubscriptionPlan } from './subscription-plan.entity';

export enum PaymentStatus {
  PENDING = 'pending',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  CANCELED = 'canceled'
}

export enum PaymentType {
  SUBSCRIPTION = 'subscription',      // Recurring subscription payment
  ONE_TIME = 'one_time',              // One-time event/course payment
  ADD_ON = 'add_on'                   // Add-on payment
}

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Payer
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  // Student
  @Column({ name: 'student_id', type: 'uuid' })
  studentId: string;

  @Column({ name: 'student_name', type: 'varchar', length: 255, nullable: true })
  studentName: string;

  // Associated plan
  @Column({ name: 'plan_id', type: 'uuid', nullable: true })
  planId: string;

  @Column({ name: 'plan_name', type: 'varchar', length: 255 })
  planName: string;

  // Associated subscription (if applicable)
  @Column({ name: 'student_subscription_id', type: 'uuid', nullable: true })
  studentSubscriptionId: string;

  // Stripe payment/invoice IDs
  @Column({ name: 'stripe_payment_intent_id', type: 'varchar', length: 64, nullable: true })
  stripePaymentIntentId: string;

  @Column({ name: 'stripe_invoice_id', type: 'varchar', length: 64, nullable: true })
  stripeInvoiceId: string;

  @Column({ name: 'stripe_charge_id', type: 'varchar', length: 64, nullable: true })
  stripeChargeId: string;

  @Column({
    type: 'enum',
    enum: PaymentType,
    default: PaymentType.SUBSCRIPTION
  })
  paymentType: PaymentType;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING
  })
  status: PaymentStatus;

  // Amount in cents
  @Column({ name: 'amount_paid', type: 'bigint' })
  amountPaid: number;

  @Column({ type: 'varchar', length: 10, default: 'usd' })
  currency: string;

  @Column({ name: 'paid_at', type: 'timestamp', nullable: true })
  paidAt: Date;

  // For refunds
  @Column({ name: 'refunded_amount', type: 'bigint', default: 0 })
  refundedAmount: number;

  @Column({ name: 'refunded_at', type: 'timestamp', nullable: true })
  refundedAt: Date;

  // Admin notes
  @Column({ type: 'text', nullable: true })
  notes: string;

  // Receipt URL from Stripe
  @Column({ name: 'receipt_url', type: 'varchar', length: 512, nullable: true })
  receiptUrl: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @ManyToOne(() => SubscriptionPlan, { nullable: true })
  @JoinColumn({ name: 'plan_id' })
  plan: SubscriptionPlan;

  @ManyToOne(() => StudentSubscription, sub => sub.payments, { nullable: true })
  @JoinColumn({ name: 'student_subscription_id' })
  studentSubscription: StudentSubscription;
}
