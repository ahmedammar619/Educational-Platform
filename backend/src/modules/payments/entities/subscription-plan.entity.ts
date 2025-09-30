import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';

export enum PlanType {
  RECURRING = 'recurring', // Monthly/yearly subscriptions
  ONE_TIME = 'one_time',   // One-time payments for events/courses
  ADD_ON = 'add_on'        // Add-on to existing subscriptions
}

export enum BillingInterval {
  MONTH = 'month',
  YEAR = 'year',
  WEEK = 'week',
  ONE_TIME = 'one_time'
}

@Entity('subscription_plans')
export class SubscriptionPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: PlanType,
    default: PlanType.RECURRING
  })
  planType: PlanType;

  @Column({
    type: 'enum',
    enum: BillingInterval,
    default: BillingInterval.MONTH
  })
  billingInterval: BillingInterval;

  // Price in cents (e.g., 5000 = $50.00)
  @Column({ type: 'bigint' })
  price: number;

  @Column({ length: 10, default: 'usd' })
  currency: string;

  // Stripe product and price IDs
  @Column({ name: 'stripe_product_id', type: 'varchar', length: 100, nullable: true })
  stripeProductId: string;

  @Column({ name: 'stripe_price_id', type: 'varchar', length: 100, nullable: true })
  stripePriceId: string;

  // Whether this is the main/base subscription
  @Column({ name: 'is_base_plan', type: 'boolean', default: false })
  isBasePlan: boolean;

  // Whether this plan is currently active and available for purchase
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  // Maximum number of students per subscription (null = unlimited)
  @Column({ name: 'max_students', type: 'int', nullable: true })
  maxStudents: number;

  // Features included in this plan (JSON array)
  @Column({ type: 'jsonb', nullable: true })
  features: string[];

  // For time-limited events/courses
  @Column({ name: 'start_date', type: 'timestamp', nullable: true })
  startDate: Date;

  @Column({ name: 'end_date', type: 'timestamp', nullable: true })
  endDate: Date;

  // For limited enrollment events
  @Column({ name: 'max_enrollments', type: 'int', nullable: true })
  maxEnrollments: number;

  @Column({ name: 'current_enrollments', type: 'int', default: 0 })
  currentEnrollments: number;

  // Category for organization (e.g., "Quran 1-to-1", "Summer Camp", "Group Classes")
  @Column({ length: 100, nullable: true })
  category: string;

  // Display order for sorting
  @Column({ name: 'display_order', type: 'int', default: 0 })
  displayOrder: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToMany('StudentSubscription', 'plan')
  studentSubscriptions: any[];
}
