import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { SubscriptionPlan, PlanType, BillingInterval } from './entities/subscription-plan.entity';
import { StudentSubscription, SubscriptionStatus } from './entities/student-subscription.entity';
import { Payment, PaymentStatus, PaymentType } from './entities/payment.entity';
import { User } from '../users/entities/user.entity';
import { Student } from '../students/entities/student.entity';
import { StripeService } from '../../common/services/stripe.service';
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto';
import { UpdateSubscriptionPlanDto } from './dto/update-subscription-plan.dto';
import { CreateStudentSubscriptionDto, BulkSubscribeDto } from './dto/create-student-subscription.dto';
import { CreateManualPaymentDto, UpdateStudentSubscriptionDto } from './dto/admin-payment.dto';

@Injectable()
export class SubscriptionPlansService {
  private readonly logger = new Logger(SubscriptionPlansService.name);

  constructor(
    @InjectRepository(SubscriptionPlan)
    private subscriptionPlanRepository: Repository<SubscriptionPlan>,
    @InjectRepository(StudentSubscription)
    private studentSubscriptionRepository: Repository<StudentSubscription>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    private stripeService: StripeService,
  ) {}

  // ============ ADMIN: Subscription Plan Management ============

  async createPlan(dto: CreateSubscriptionPlanDto): Promise<SubscriptionPlan> {
    this.logger.log(`Creating new subscription plan: ${dto.name}`);

    // Create Stripe product and price if Stripe is configured
    let stripeProductId: string;
    let stripePriceId: string;

    if (this.stripeService.isConfigured()) {
      try {
        // Create Stripe product
        const stripeProduct = await this.stripeService['stripe'].products.create({
          name: dto.name,
          description: dto.description || '',
          metadata: {
            planType: dto.planType,
            category: dto.category || '',
          }
        });
        stripeProductId = stripeProduct.id;

        // Create Stripe price
        const priceData: any = {
          product: stripeProductId,
          currency: dto.currency || 'usd',
          unit_amount: dto.price,
        };

        // Set recurring or one-time based on plan type
        if (dto.planType === PlanType.RECURRING || dto.planType === PlanType.ADD_ON) {
          if (dto.billingInterval !== BillingInterval.ONE_TIME) {
            priceData.recurring = {
              interval: dto.billingInterval,
            };
          }
        }

        const stripePrice = await this.stripeService['stripe'].prices.create(priceData);
        stripePriceId = stripePrice.id;

        this.logger.log(`Created Stripe product ${stripeProductId} and price ${stripePriceId}`);
      } catch (error) {
        this.logger.error(`Failed to create Stripe product/price: ${error.message}`);
        // Continue without Stripe IDs in development
      }
    }

    const plan = this.subscriptionPlanRepository.create({
      ...dto,
      stripeProductId,
      stripePriceId,
    });

    return this.subscriptionPlanRepository.save(plan);
  }

  async getAllPlans(includeInactive = false): Promise<SubscriptionPlan[]> {
    const where = includeInactive ? {} : { isActive: true };
    return this.subscriptionPlanRepository.find({
      where,
      order: { displayOrder: 'ASC', createdAt: 'DESC' }
    });
  }

  async getPlansByType(planType: PlanType): Promise<SubscriptionPlan[]> {
    return this.subscriptionPlanRepository.find({
      where: { planType, isActive: true },
      order: { displayOrder: 'ASC' }
    });
  }

  async getPlansByCategory(category: string): Promise<SubscriptionPlan[]> {
    return this.subscriptionPlanRepository.find({
      where: { category, isActive: true },
      order: { displayOrder: 'ASC' }
    });
  }

  async getPlanById(id: string): Promise<SubscriptionPlan> {
    const plan = await this.subscriptionPlanRepository.findOne({ where: { id } });
    if (!plan) {
      throw new NotFoundException(`Subscription plan with ID ${id} not found`);
    }
    return plan;
  }

  async updatePlan(id: string, dto: UpdateSubscriptionPlanDto): Promise<SubscriptionPlan> {
    const plan = await this.getPlanById(id);

    // Update Stripe product/price if price or name changed
    if (this.stripeService.isConfigured() && plan.stripeProductId) {
      try {
        if (dto.name || dto.description) {
          await this.stripeService['stripe'].products.update(plan.stripeProductId, {
            name: dto.name || plan.name,
            description: dto.description !== undefined ? dto.description : plan.description,
          });
        }

        // If price changed, create new Stripe price (prices are immutable in Stripe)
        if (dto.price && dto.price !== plan.price) {
          const priceData: any = {
            product: plan.stripeProductId,
            currency: dto.currency || plan.currency,
            unit_amount: dto.price,
          };

          if (plan.planType === PlanType.RECURRING && plan.billingInterval !== BillingInterval.ONE_TIME) {
            priceData.recurring = {
              interval: dto.billingInterval || plan.billingInterval,
            };
          }

          const newStripePrice = await this.stripeService['stripe'].prices.create(priceData);
          dto['stripePriceId'] = newStripePrice.id;

          // Archive old price
          if (plan.stripePriceId) {
            await this.stripeService['stripe'].prices.update(plan.stripePriceId, { active: false });
          }
        }
      } catch (error) {
        this.logger.error(`Failed to update Stripe product/price: ${error.message}`);
      }
    }

    Object.assign(plan, dto);
    return this.subscriptionPlanRepository.save(plan);
  }

  async deletePlan(id: string): Promise<void> {
    const plan = await this.getPlanById(id);

    // Check if plan has active subscriptions
    const activeSubscriptions = await this.studentSubscriptionRepository.count({
      where: { planId: id, status: In([SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING]) }
    });

    if (activeSubscriptions > 0) {
      throw new BadRequestException(`Cannot delete plan with ${activeSubscriptions} active subscriptions. Deactivate it instead.`);
    }

    // Archive Stripe product if exists
    if (this.stripeService.isConfigured() && plan.stripeProductId) {
      try {
        await this.stripeService['stripe'].products.update(plan.stripeProductId, { active: false });
      } catch (error) {
        this.logger.error(`Failed to archive Stripe product: ${error.message}`);
      }
    }

    await this.subscriptionPlanRepository.remove(plan);
  }

  async togglePlanStatus(id: string): Promise<SubscriptionPlan> {
    const plan = await this.getPlanById(id);
    plan.isActive = !plan.isActive;
    return this.subscriptionPlanRepository.save(plan);
  }

  // ============ PARENT: Browse and Subscribe to Plans ============

  async getAvailablePlansForParent(): Promise<any> {
    const allPlans = await this.subscriptionPlanRepository.find({
      where: { isActive: true },
      order: { displayOrder: 'ASC', category: 'ASC' }
    });

    // Group by category and type
    const grouped = {
      basePlans: [] as SubscriptionPlan[],
      addOns: [] as SubscriptionPlan[],
      events: [] as SubscriptionPlan[],
      byCategory: {} as Record<string, SubscriptionPlan[]>
    };

    for (const plan of allPlans) {
      // Check if event is still available
      if (plan.endDate && new Date(plan.endDate) < new Date()) {
        continue; // Skip expired events
      }

      if (plan.maxEnrollments && plan.currentEnrollments >= plan.maxEnrollments) {
        continue; // Skip full events
      }

      if (plan.isBasePlan) {
        grouped.basePlans.push(plan);
      } else if (plan.planType === PlanType.ONE_TIME) {
        grouped.events.push(plan);
      } else if (plan.planType === PlanType.ADD_ON) {
        grouped.addOns.push(plan);
      }

      // Group by category
      if (plan.category) {
        if (!grouped.byCategory[plan.category]) {
          grouped.byCategory[plan.category] = [];
        }
        grouped.byCategory[plan.category].push(plan);
      }
    }

    return grouped;
  }

  async subscribeStudentToPlan(
    parentId: string,
    studentId: string,
    planId: string,
    notes?: string
  ): Promise<{ checkoutUrl?: string; subscription: StudentSubscription }> {
    const [parent, student, plan] = await Promise.all([
      this.userRepository.findOne({ where: { id: parentId } }),
      this.userRepository.findOne({ where: { id: studentId } }),
      this.getPlanById(planId)
    ]);

    if (!parent || !student) {
      throw new NotFoundException('Parent or student not found');
    }

    // Check if already subscribed to this plan (only block for active/trialing, allow retry for incomplete)
    const existing = await this.studentSubscriptionRepository.findOne({
      where: {
        userId: parentId,
        studentId,
        planId,
        status: In([SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING])
      }
    });

    if (existing) {
      throw new BadRequestException('Student is already subscribed to this plan');
    }

    // Check for incomplete subscription - if exists, delete it before creating new one
    const incompleteSubscription = await this.studentSubscriptionRepository.findOne({
      where: {
        userId: parentId,
        studentId,
        planId,
        status: SubscriptionStatus.INCOMPLETE
      }
    });

    if (incompleteSubscription) {
      this.logger.log(`Deleting previous incomplete subscription ${incompleteSubscription.id}`);
      await this.studentSubscriptionRepository.delete(incompleteSubscription.id);
    }

    // Check enrollment limits for events
    if (plan.maxEnrollments && plan.currentEnrollments >= plan.maxEnrollments) {
      throw new BadRequestException('This event is fully booked');
    }

    // Create or get Stripe customer
    let stripeCustomerId = parent.stripe_customer_id;
    if (!stripeCustomerId && this.stripeService.isConfigured()) {
      const stripeCustomer = await this.stripeService.createCustomer(
        parent.email,
        `${parent.firstName} ${parent.lastName}`,
        { userId: parentId }
      );
      stripeCustomerId = stripeCustomer.id;
      await this.userRepository.update(parentId, { stripe_customer_id: stripeCustomerId });
    }

    // Create subscription record
    const subscription = this.studentSubscriptionRepository.create({
      userId: parentId,
      studentId,
      planId,
      studentName: `${student.firstName} ${student.lastName}`,
      planName: plan.name,
      stripeCustomerId,
      status: SubscriptionStatus.INCOMPLETE,
      amount: plan.price,
      currency: plan.currency,
      notes
    });

    await this.studentSubscriptionRepository.save(subscription);

    // Increment enrollment for events
    if (plan.planType === PlanType.ONE_TIME) {
      await this.subscriptionPlanRepository.update(planId, {
        currentEnrollments: plan.currentEnrollments + 1
      });
    }

    // Create Stripe checkout session
    let checkoutUrl: string;
    if (this.stripeService.isConfigured() && plan.stripePriceId) {
      try {
        const session = await this.stripeService['stripe'].checkout.sessions.create({
          customer: stripeCustomerId,
          payment_method_types: ['card'],
          mode: plan.planType === PlanType.ONE_TIME ? 'payment' : 'subscription',
          line_items: [{
            price: plan.stripePriceId,
            quantity: 1,
          }],
          success_url: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/parent/subscriptions?session_id={CHECKOUT_SESSION_ID}&success=true`,
          cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/parent/subscriptions?canceled=true`,
          metadata: {
            parentId,
            studentId,
            planId,
            subscriptionId: subscription.id,
            studentName: subscription.studentName,
          },
          ...(plan.planType !== PlanType.ONE_TIME && {
            subscription_data: {
              metadata: {
                parentId,
                studentId,
                planId,
                subscriptionId: subscription.id,
                studentName: subscription.studentName,
              }
            }
          })
        });

        checkoutUrl = session.url;
      } catch (error) {
        this.logger.error(`Failed to create checkout session: ${error.message}`);
        throw new BadRequestException(`Failed to create checkout session: ${error.message}`);
      }
    }

    return { checkoutUrl, subscription };
  }

  async bulkSubscribeStudent(parentId: string, dto: BulkSubscribeDto): Promise<any> {
    const results = [];

    for (const planId of dto.planIds) {
      try {
        const result = await this.subscribeStudentToPlan(parentId, dto.studentId, planId, dto.notes);
        results.push({
          planId,
          success: true,
          checkoutUrl: result.checkoutUrl,
          subscription: result.subscription
        });
      } catch (error) {
        results.push({
          planId,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }

  // ============ ADMIN: Student Subscription Management ============

  async getAllStudentSubscriptions(filters?: any): Promise<StudentSubscription[]> {
    const query = this.studentSubscriptionRepository
      .createQueryBuilder('sub')
      .leftJoinAndSelect('sub.user', 'parent')
      .leftJoinAndSelect('sub.student', 'studentRel')
      .leftJoinAndSelect('studentRel.user', 'studentUser')
      .leftJoinAndSelect('sub.plan', 'plan')
      .orderBy('sub.createdAt', 'DESC');

    if (filters?.status && filters.status !== 'all') {
      query.andWhere('sub.status = :status', { status: filters.status });
    }

    if (filters?.planId) {
      query.andWhere('sub.planId = :planId', { planId: filters.planId });
    }

    if (filters?.studentId) {
      query.andWhere('sub.studentId = :studentId', { studentId: filters.studentId });
    }

    if (filters?.search) {
      query.andWhere(
        '(parent.firstName ILIKE :search OR parent.lastName ILIKE :search OR parent.email ILIKE :search OR sub.studentName ILIKE :search OR sub.planName ILIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    return query.getMany();
  }

  async getStudentSubscriptionById(id: string): Promise<StudentSubscription> {
    const subscription = await this.studentSubscriptionRepository.findOne({
      where: { id },
      relations: ['user', 'student', 'student.user', 'plan', 'payments']
    });

    if (!subscription) {
      throw new NotFoundException(`Subscription with ID ${id} not found`);
    }

    return subscription;
  }

  async updateStudentSubscription(id: string, dto: UpdateStudentSubscriptionDto): Promise<StudentSubscription> {
    const subscription = await this.getStudentSubscriptionById(id);
    Object.assign(subscription, dto);
    return this.studentSubscriptionRepository.save(subscription);
  }

  async cancelStudentSubscription(id: string, cancelAtPeriodEnd = true): Promise<StudentSubscription> {
    const subscription = await this.getStudentSubscriptionById(id);

    if (subscription.stripeSubscriptionId && this.stripeService.isConfigured()) {
      try {
        await this.stripeService.cancelSubscription(subscription.stripeSubscriptionId, cancelAtPeriodEnd);
      } catch (error) {
        this.logger.error(`Failed to cancel Stripe subscription: ${error.message}`);
      }
    }

    subscription.status = SubscriptionStatus.CANCELED;
    subscription.canceledAt = new Date();
    return this.studentSubscriptionRepository.save(subscription);
  }

  // ============ ADMIN: Manual Payment Recording ============

  async createManualPayment(parentId: string, dto: CreateManualPaymentDto): Promise<Payment> {
    const [student, plan] = await Promise.all([
      this.userRepository.findOne({ where: { id: dto.studentId } }),
      this.getPlanById(dto.planId)
    ]);

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Find or create subscription
    let subscription = await this.studentSubscriptionRepository.findOne({
      where: {
        userId: parentId,
        studentId: dto.studentId,
        planId: dto.planId
      }
    });

    if (!subscription) {
      subscription = await this.studentSubscriptionRepository.save({
        userId: parentId,
        studentId: dto.studentId,
        planId: dto.planId,
        studentName: `${student.firstName} ${student.lastName}`,
        planName: plan.name,
        status: SubscriptionStatus.ACTIVE,
        amount: dto.amountPaid,
        currency: dto.currency || 'usd',
        isPaid: true,
        paidAt: dto.paidAt ? new Date(dto.paidAt) : new Date(),
        notes: dto.notes
      });
    } else {
      subscription.isPaid = true;
      subscription.paidAt = dto.paidAt ? new Date(dto.paidAt) : new Date();
      subscription.status = SubscriptionStatus.ACTIVE;
      await this.studentSubscriptionRepository.save(subscription);
    }

    // Create payment record
    const payment = this.paymentRepository.create({
      userId: parentId,
      studentId: dto.studentId,
      studentName: `${student.firstName} ${student.lastName}`,
      planId: dto.planId,
      planName: plan.name,
      studentSubscriptionId: subscription.id,
      paymentType: plan.planType === PlanType.ONE_TIME ? PaymentType.ONE_TIME : PaymentType.SUBSCRIPTION,
      status: PaymentStatus.SUCCEEDED,
      amountPaid: dto.amountPaid,
      currency: dto.currency || 'usd',
      paidAt: dto.paidAt ? new Date(dto.paidAt) : new Date(),
      notes: dto.notes
    });

    return this.paymentRepository.save(payment);
  }

  // ============ REPORTING & ANALYTICS ============

  async getPaymentStats(): Promise<any> {
    const [totalRevenue, monthlyRevenue, activeSubscriptions, totalPayments] = await Promise.all([
      this.paymentRepository
        .createQueryBuilder('payment')
        .select('SUM(payment.amountPaid)', 'total')
        .where('payment.status = :status', { status: PaymentStatus.SUCCEEDED })
        .getRawOne(),
      this.paymentRepository
        .createQueryBuilder('payment')
        .select('SUM(payment.amountPaid)', 'total')
        .where('payment.status = :status', { status: PaymentStatus.SUCCEEDED })
        .andWhere('payment.paidAt >= :date', { date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) })
        .getRawOne(),
      this.studentSubscriptionRepository.count({
        where: { status: In([SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING]) }
      }),
      this.paymentRepository.count()
    ]);

    // Revenue by plan
    const revenueByPlan = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('payment.planName', 'planName')
      .addSelect('SUM(payment.amountPaid)', 'revenue')
      .addSelect('COUNT(*)', 'count')
      .where('payment.status = :status', { status: PaymentStatus.SUCCEEDED })
      .groupBy('payment.planName')
      .orderBy('revenue', 'DESC')
      .getRawMany();

    return {
      totalRevenue: parseInt(totalRevenue?.total || '0'),
      monthlyRevenue: parseInt(monthlyRevenue?.total || '0'),
      activeSubscriptions,
      totalPayments,
      revenueByPlan
    };
  }

  async getParentSubscriptions(parentId: string): Promise<StudentSubscription[]> {
    const subscriptions = await this.studentSubscriptionRepository.find({
      where: { userId: parentId },
      relations: ['student', 'student.user', 'plan'],
      order: { createdAt: 'DESC' }
    });

    // Enrich with real-time Stripe data for recurring subscriptions
    if (this.stripeService.isConfigured()) {
      for (const sub of subscriptions) {
        // Log database values before Stripe enrichment
        this.logger.log(`DB subscription ${sub.id}: stripeSubId=${sub.stripeSubscriptionId}, status=${sub.status}, periodStart=${sub.currentPeriodStart}, periodEnd=${sub.currentPeriodEnd}, cancelAt=${sub.cancelAt}`);

        if (sub.stripeSubscriptionId) {
          try {
            const stripeSub: any = await this.stripeService['stripe'].subscriptions.retrieve(sub.stripeSubscriptionId);

            if (!stripeSub) {
              this.logger.warn(`Stripe subscription ${sub.stripeSubscriptionId} not found`);
              continue;
            }

            // Stripe uses billing_cycle_anchor to calculate periods
            const billingCycleAnchor = stripeSub.billing_cycle_anchor;
            const planInterval = stripeSub.items?.data?.[0]?.plan?.interval || 'month';
            const intervalCount = stripeSub.items?.data?.[0]?.plan?.interval_count || 1;

            // Calculate current period start and end from billing cycle anchor
            const now = Math.floor(Date.now() / 1000);
            const anchorDate = new Date(billingCycleAnchor * 1000);
            let currentPeriodStart = billingCycleAnchor;
            let currentPeriodEnd = billingCycleAnchor;

            // Calculate how many intervals have passed since the anchor
            const timeDiff = now - billingCycleAnchor;
            let intervalSeconds: number;

            if (planInterval === 'year') {
              intervalSeconds = 365 * 24 * 60 * 60 * intervalCount;
            } else if (planInterval === 'month') {
              intervalSeconds = 30 * 24 * 60 * 60 * intervalCount; // Approximate
            } else if (planInterval === 'week') {
              intervalSeconds = 7 * 24 * 60 * 60 * intervalCount;
            } else {
              intervalSeconds = 24 * 60 * 60 * intervalCount; // day
            }

            const intervalsPassed = Math.floor(timeDiff / intervalSeconds);
            currentPeriodStart = billingCycleAnchor + (intervalsPassed * intervalSeconds);
            currentPeriodEnd = currentPeriodStart + intervalSeconds;

            this.logger.log(`Calculated dates for ${sub.stripeSubscriptionId}: periodStart=${new Date(currentPeriodStart * 1000).toISOString()}, periodEnd=${new Date(currentPeriodEnd * 1000).toISOString()}`);

            // Update with fresh Stripe data
            const updatedData: any = {};

            // Only update status if not scheduled for cancellation
            // If cancel_at_period_end is true, keep our CANCELED status, don't use Stripe's "active"
            if (!stripeSub.cancel_at_period_end) {
              updatedData.status = stripeSub.status as SubscriptionStatus;
            } else {
              // If scheduled for cancellation, ensure it's marked as CANCELED in our DB
              if (sub.status !== SubscriptionStatus.CANCELED) {
                updatedData.status = SubscriptionStatus.CANCELED;
                updatedData.canceledAt = new Date();
              }
            }

            // Set the calculated period dates
            updatedData.currentPeriodStart = new Date(currentPeriodStart * 1000);
            updatedData.currentPeriodEnd = new Date(currentPeriodEnd * 1000);
            if (stripeSub.cancel_at) {
              updatedData.cancelAt = new Date(stripeSub.cancel_at * 1000);
            }
            if (stripeSub.canceled_at) {
              updatedData.canceledAt = new Date(stripeSub.canceled_at * 1000);
            }

            // Update in memory for response
            Object.assign(sub, updatedData);

            // Add cancel_at_period_end flag (not stored in DB, just for response)
            (sub as any).cancelAtPeriodEnd = stripeSub.cancel_at_period_end;

            // Save to database to keep in sync (only if we have updates)
            if (Object.keys(updatedData).length > 0) {
              await this.studentSubscriptionRepository.update(sub.id, updatedData);
            }

            this.logger.log(`Enriched subscription ${sub.id} - Status: ${sub.status}, cancel_at_period_end: ${stripeSub.cancel_at_period_end}, Period end: ${sub.currentPeriodEnd}`);
          } catch (error) {
            this.logger.warn(`Failed to fetch Stripe data for subscription ${sub.stripeSubscriptionId}: ${error.message}`);
          }
        }
      }
    }

    return subscriptions;
  }

  async getParentPayments(parentId: string): Promise<any[]> {
    // Get parent's Stripe customer ID
    const parent = await this.userRepository.findOne({ where: { id: parentId } });

    if (!parent || !parent.stripe_customer_id) {
      this.logger.warn(`No Stripe customer ID found for parent ${parentId}`);
      return [];
    }

    if (!this.stripeService.isConfigured()) {
      return [];
    }

    const stripeCustomerId = parent.stripe_customer_id;
    this.logger.log(`Fetching Stripe payments for customer ${stripeCustomerId}`);

    try {
      const payments: any[] = [];

      // Fetch all charges for this customer
      const charges = await this.stripeService['stripe'].charges.list({
        customer: stripeCustomerId,
        limit: 100
      });

      this.logger.log(`Found ${charges.data.length} charges from Stripe`);

      // Get all subscriptions to map student names
      const subscriptions = await this.studentSubscriptionRepository.find({
        where: { userId: parentId },
        relations: ['student', 'plan']
      });

      for (const chargeData of charges.data) {
        const charge: any = chargeData;
        // Find associated subscription from metadata or invoice
        let studentName = 'Unknown';
        let planName = 'Unknown';

        // Try to get metadata from payment intent
        if (charge.payment_intent) {
          try {
            const paymentIntent: any = await this.stripeService['stripe'].paymentIntents.retrieve(charge.payment_intent as string);
            if (paymentIntent.metadata) {
              studentName = paymentIntent.metadata.studentName || studentName;
              planName = paymentIntent.metadata.planName || planName;
            }
          } catch (error) {
            this.logger.warn(`Failed to fetch payment intent metadata: ${error.message}`);
          }
        }

        // Try to get from invoice
        if (charge.invoice) {
          try {
            const invoice: any = await this.stripeService['stripe'].invoices.retrieve(charge.invoice as string);
            if (invoice.subscription) {
              const subscription = subscriptions.find(s => s.stripeSubscriptionId === invoice.subscription);
              if (subscription) {
                studentName = subscription.studentName || studentName;
                planName = subscription.planName || planName;
              }
            }
            // Use invoice metadata if available
            if (invoice.metadata) {
              studentName = invoice.metadata.studentName || studentName;
              planName = invoice.metadata.planName || planName;
            }
          } catch (error) {
            this.logger.warn(`Failed to fetch invoice metadata: ${error.message}`);
          }
        }

        payments.push({
          id: charge.id,
          studentName,
          planName,
          amountPaid: charge.amount,
          currency: charge.currency,
          status: charge.status === 'succeeded' ? 'succeeded' : charge.status === 'failed' ? 'failed' : 'pending',
          paidAt: new Date(charge.created * 1000),
          createdAt: new Date(charge.created * 1000),
          receiptUrl: charge.receipt_url,
          stripeChargeId: charge.id
        });
      }

      // Also fetch invoices (for subscription payments)
      const invoices = await this.stripeService['stripe'].invoices.list({
        customer: stripeCustomerId,
        limit: 100
      });

      this.logger.log(`Found ${invoices.data.length} invoices from Stripe`);

      for (const invoiceData of invoices.data) {
        const invoice: any = invoiceData;
        // Skip if we already have this charge
        if (invoice.charge && payments.some(p => p.stripeChargeId === invoice.charge)) {
          continue;
        }

        let studentName = 'Unknown';
        let planName = 'Unknown';

        // Try to find subscription
        if (invoice.subscription) {
          const subscription = subscriptions.find(s => s.stripeSubscriptionId === invoice.subscription);
          if (subscription) {
            studentName = subscription.studentName || studentName;
            planName = subscription.planName || planName;
          }
        }

        // Use invoice metadata
        if (invoice.metadata) {
          studentName = invoice.metadata.studentName || studentName;
          planName = invoice.metadata.planName || planName;
        }

        payments.push({
          id: invoice.id,
          studentName,
          planName,
          amountPaid: invoice.amount_paid,
          currency: invoice.currency,
          status: invoice.status === 'paid' ? 'succeeded' : invoice.status === 'open' ? 'pending' : 'failed',
          paidAt: invoice.status_transitions?.paid_at ? new Date(invoice.status_transitions.paid_at * 1000) : new Date(invoice.created * 1000),
          createdAt: new Date(invoice.created * 1000),
          receiptUrl: invoice.hosted_invoice_url,
          stripeInvoiceId: invoice.id
        });
      }

      // Sort by date descending
      payments.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      this.logger.log(`Returning ${payments.length} total payments`);

      return payments;
    } catch (error) {
      this.logger.error(`Failed to fetch Stripe payments: ${error.message}`);
      return [];
    }
  }

  // ============ PARENT: Subscription Management ============

  async cancelParentSubscription(parentId: string, subscriptionId: string): Promise<StudentSubscription> {
    const subscription = await this.studentSubscriptionRepository.findOne({
      where: { id: subscriptionId, userId: parentId }
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found or does not belong to this parent');
    }

    // Check Stripe status first if subscription has Stripe ID
    if (subscription.stripeSubscriptionId && this.stripeService.isConfigured()) {
      try {
        const stripeSub: any = await this.stripeService['stripe'].subscriptions.retrieve(subscription.stripeSubscriptionId);

        this.logger.log(`Stripe status: ${stripeSub.status}, cancel_at_period_end: ${stripeSub.cancel_at_period_end}`);

        // If already canceled in Stripe
        if (stripeSub.status === 'canceled') {
          // Update our DB to match
          subscription.status = SubscriptionStatus.CANCELED;
          subscription.canceledAt = stripeSub.canceled_at ? new Date(stripeSub.canceled_at * 1000) : new Date();
          await this.studentSubscriptionRepository.save(subscription);
          throw new BadRequestException('Subscription is already canceled');
        }

        // If already scheduled for cancellation
        if (stripeSub.cancel_at_period_end) {
          throw new BadRequestException('Subscription is already scheduled for cancellation at the end of the period');
        }

        // Cancel the subscription in Stripe (schedules for end of period)
        await this.stripeService.cancelSubscription(subscription.stripeSubscriptionId, true);
        this.logger.log(`Scheduled cancellation for Stripe subscription ${subscription.stripeSubscriptionId}`);

        // Mark as canceled in our database immediately
        subscription.status = SubscriptionStatus.CANCELED;
        subscription.canceledAt = new Date();
        if (stripeSub.current_period_end) {
          subscription.currentPeriodEnd = new Date(stripeSub.current_period_end * 1000);
        }
        await this.studentSubscriptionRepository.save(subscription);

        return subscription;

      } catch (error) {
        // If it's our BadRequestException, re-throw it
        if (error instanceof BadRequestException) {
          throw error;
        }
        this.logger.error(`Failed to cancel Stripe subscription: ${error.message}`);
        throw new BadRequestException(`Failed to cancel subscription: ${error.message}`);
      }
    }

    // For subscriptions without Stripe ID, just mark as canceled
    subscription.status = SubscriptionStatus.CANCELED;
    subscription.canceledAt = new Date();
    return this.studentSubscriptionRepository.save(subscription);
  }

  async reactivateParentSubscription(parentId: string, subscriptionId: string): Promise<{ checkoutUrl?: string; subscription: StudentSubscription }> {
    const subscription = await this.studentSubscriptionRepository.findOne({
      where: { id: subscriptionId, userId: parentId },
      relations: ['plan', 'student']
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found or does not belong to this parent');
    }

    if (subscription.status !== SubscriptionStatus.CANCELED) {
      throw new BadRequestException('Can only reactivate canceled subscriptions');
    }

    const plan = subscription.plan;

    // For one-time events, check if still available
    if (plan.planType === PlanType.ONE_TIME) {
      if (plan.endDate && new Date(plan.endDate) < new Date()) {
        throw new BadRequestException('This event has already ended');
      }
      if (plan.maxEnrollments && plan.currentEnrollments >= plan.maxEnrollments) {
        throw new BadRequestException('This event is fully booked');
      }
    }

    // Check if Stripe subscription still exists and is just scheduled for cancellation
    if (subscription.stripeSubscriptionId && this.stripeService.isConfigured() && plan.planType !== PlanType.ONE_TIME) {
      try {
        const stripeSub: any = await this.stripeService['stripe'].subscriptions.retrieve(subscription.stripeSubscriptionId);

        // If subscription is still active in Stripe (just scheduled to cancel), remove the cancellation
        if ((stripeSub.status === 'active' || stripeSub.status === 'trialing') && stripeSub.cancel_at_period_end) {
          this.logger.log(`Removing cancellation from existing Stripe subscription ${subscription.stripeSubscriptionId}`);

          // Remove the cancellation by updating the subscription
          await this.stripeService['stripe'].subscriptions.update(subscription.stripeSubscriptionId, {
            cancel_at_period_end: false
          });

          // Update our database
          subscription.status = SubscriptionStatus.ACTIVE;
          subscription.canceledAt = null;
          subscription.cancelAt = null;
          await this.studentSubscriptionRepository.save(subscription);

          this.logger.log(`Successfully reactivated subscription ${subscription.id} without creating duplicate`);

          // Return without checkout URL - subscription is already active
          return { subscription };
        } else {
          this.logger.log(`Stripe subscription ${subscription.stripeSubscriptionId} is truly canceled (status: ${stripeSub.status}), will create new subscription`);
        }
      } catch (error) {
        // If subscription not found in Stripe (404), proceed to create new one
        if (error.statusCode === 404 || error.code === 'resource_missing') {
          this.logger.log(`Stripe subscription ${subscription.stripeSubscriptionId} not found, will create new subscription`);
        } else {
          this.logger.warn(`Error retrieving Stripe subscription: ${error.message}`);
          // For other errors, proceed to create new subscription
        }
      }
    }

    // Only reach here if:
    // 1. No Stripe subscription ID exists
    // 2. Stripe subscription is truly canceled (not just scheduled)
    // 3. It's a one-time payment
    // 4. Stripe API error occurred

    // Get or create Stripe customer
    const parent = await this.userRepository.findOne({ where: { id: parentId } });
    let stripeCustomerId = parent.stripe_customer_id;
    if (!stripeCustomerId && this.stripeService.isConfigured()) {
      const stripeCustomer = await this.stripeService.createCustomer(
        parent.email,
        `${parent.firstName} ${parent.lastName}`,
        { userId: parentId }
      );
      stripeCustomerId = stripeCustomer.id;
      await this.userRepository.update(parentId, { stripe_customer_id: stripeCustomerId });
    }

    // Update subscription status
    subscription.status = SubscriptionStatus.INCOMPLETE;
    subscription.canceledAt = null;
    subscription.stripeCustomerId = stripeCustomerId;
    await this.studentSubscriptionRepository.save(subscription);

    // Create Stripe checkout session
    let checkoutUrl: string;
    if (this.stripeService.isConfigured() && plan.stripePriceId) {
      try {
        const session = await this.stripeService['stripe'].checkout.sessions.create({
          customer: stripeCustomerId,
          payment_method_types: ['card'],
          mode: plan.planType === PlanType.ONE_TIME ? 'payment' : 'subscription',
          line_items: [{
            price: plan.stripePriceId,
            quantity: 1,
          }],
          success_url: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/parent/subscriptions?session_id={CHECKOUT_SESSION_ID}&success=true`,
          cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/parent/subscriptions?canceled=true`,
          metadata: {
            parentId,
            studentId: subscription.studentId,
            planId: plan.id,
            subscriptionId: subscription.id,
            studentName: subscription.studentName,
          },
          ...(plan.planType !== PlanType.ONE_TIME && {
            subscription_data: {
              metadata: {
                parentId,
                studentId: subscription.studentId,
                planId: plan.id,
                subscriptionId: subscription.id,
                studentName: subscription.studentName,
              }
            }
          })
        });

        checkoutUrl = session.url;
      } catch (error) {
        this.logger.error(`Failed to create checkout session: ${error.message}`);
        throw new BadRequestException(`Failed to create checkout session: ${error.message}`);
      }
    }

    return { checkoutUrl, subscription };
  }
}
