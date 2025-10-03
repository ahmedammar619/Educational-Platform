import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Student } from '../students/entities/student.entity';
import { Role } from '../../common/enums/role.enum';
import { WebhookEvent } from './entities/webhook-event.entity';
import { Subscription } from './entities/subscription.entity';
import { StudentSubscription } from './entities/student-subscription.entity';
import { Payment, PaymentStatus, PaymentType } from './entities/payment.entity';
import { Invoice } from './entities/invoice.entity';
import { StripeService } from '../../common/services/stripe.service';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(WebhookEvent)
    private webhookEventRepository: Repository<WebhookEvent>,
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    @InjectRepository(StudentSubscription)
    private studentSubscriptionRepository: Repository<StudentSubscription>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
    private stripeService: StripeService,
  ) {}

  async createStudentSubscription(parentId: string, studentId: string): Promise<{
    checkoutUrl: string;
  }> {
    console.log(`🔍 Creating subscription for parentId: "${parentId}", studentId: "${studentId}"`);
    
    if (!parentId || !studentId) {
      throw new BadRequestException('Parent ID and Student ID are required');
    }

    // Get parent user
    const parent = await this.userRepository.findOne({ where: { id: parentId } });
    if (!parent) {
      throw new NotFoundException('Parent not found');
    }

    // Get student user
    const student = await this.userRepository.findOne({ where: { id: studentId } });
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Check Stripe directly for existing active subscriptions (source of truth)
    if (parent.stripe_customer_id && this.stripeService.isConfigured()) {
      try {
        const stripeSubscriptions = await this.stripeService.getCustomerSubscriptions(parent.stripe_customer_id);
        const studentName = `${student.firstName} ${student.lastName}`;
        
        // Check if there's an active subscription for this student in Stripe
        const activeStripeSubscription = stripeSubscriptions.find(sub => 
          (sub.status === 'active' || sub.status === 'trialing') &&
          (sub.metadata?.studentId === studentId || 
           sub.metadata?.studentName === studentName ||
           sub.metadata?.description?.includes(studentName))
        );

        if (activeStripeSubscription) {
          throw new BadRequestException('An active subscription already exists for this student in Stripe');
        }
      } catch (stripeError) {
        console.log('⚠️ Could not check Stripe subscriptions, proceeding with creation:', stripeError.message);
      }
    }

    try {
      // Create or get Stripe customer
      let stripeCustomer;
      if (parent.stripe_customer_id) {
        stripeCustomer = await this.stripeService.getCustomer(parent.stripe_customer_id);
      } else {
        stripeCustomer = await this.stripeService.createCustomer(
          parent.email,
          `${parent.firstName} ${parent.lastName}`,
          { 
            userId: parentId, 
            studentId: studentId, 
            studentName: `${student.firstName} ${student.lastName}` 
          }
        );
        
        // Save stripe customer ID to parent
        if (!parentId) {
          throw new BadRequestException('Invalid parent ID');
        }
        
        console.log(`💾 Saving Stripe customer ID ${stripeCustomer.id} to parent ${parentId}`);
        const updateResult = await this.userRepository.update(parentId, { 
          stripe_customer_id: stripeCustomer.id 
        });
        console.log(`✅ Update result:`, updateResult);
      }

      // Create Stripe Checkout session
      const checkoutSession = await this.stripeService.createCheckoutSession(
        stripeCustomer.id,
        `${student.firstName} ${student.lastName} - Monthly Subscription`,
        { 
          parentId: parentId,
          studentId: studentId, 
          studentName: `${student.firstName} ${student.lastName}` 
        }
      );

      // Create subscription record in our database (pending status)
      const subscription = await this.subscriptionRepository.save({
        userId: parentId,
        studentId: studentId,
        stripeSubscriptionId: null, // Will be updated when webhook fires
        status: 'incomplete',
        currentPeriodStart: null,
        currentPeriodEnd: null,
        cancelAt: null,
        canceledAt: null,
      });

      console.log(`📝 Created subscription record: ${subscription.id} for student ${studentId}`);

      return { checkoutUrl: checkoutSession.url };
    } catch (error) {
      throw new BadRequestException(`Failed to create subscription: ${error.message}`);
    }
  }

  async cancelStudentSubscription(parentId: string, studentId: string) {
    console.log(`🚫 Canceling subscription for parentId: "${parentId}", studentId: "${studentId}"`);
    
    if (!parentId || !studentId) {
      throw new BadRequestException('Parent ID and Student ID are required');
    }

    // First check current status to get Stripe subscription ID
    const currentStatus = await this.getStudentSubscriptionStatus(parentId, studentId);
    
    if (!currentStatus.hasSubscription || !currentStatus.subscriptionDetails?.id) {
      throw new NotFoundException('No active subscription found to cancel');
    }

    if (!this.stripeService.isConfigured()) {
      throw new BadRequestException('Payment system is not configured');
    }

    try {
      // Cancel the subscription in Stripe
      console.log(`🚫 Canceling Stripe subscription: ${currentStatus.subscriptionDetails.id}`);
      const canceledSubscription = await this.stripeService.cancelSubscription(currentStatus.subscriptionDetails.id, true);
      
      // Update our database
      const dbSubscription = await this.subscriptionRepository.findOne({
        where: { userId: parentId, studentId: studentId }
      });

      if (dbSubscription) {
        await this.subscriptionRepository.update(dbSubscription.id, {
          status: canceledSubscription.status,
          cancelAt: canceledSubscription.cancel_at ? new Date(canceledSubscription.cancel_at * 1000) : null,
          canceledAt: canceledSubscription.canceled_at ? new Date(canceledSubscription.canceled_at * 1000) : null
        });
      }

      console.log(`✅ Successfully canceled subscription: ${currentStatus.subscriptionDetails.id}`);
      return {
        success: true,
        message: 'Subscription will be canceled at the end of the current billing period',
        cancelAt: canceledSubscription.cancel_at ? new Date(canceledSubscription.cancel_at * 1000) : null
      };
    } catch (error) {
      console.error('❌ Error canceling subscription:', error);
      throw new BadRequestException(`Failed to cancel subscription: ${error.message}`);
    }
  }

  async reactivateStudentSubscription(parentId: string, studentId: string) {
    console.log(`🔄 Reactivating subscription for parentId: "${parentId}", studentId: "${studentId}"`);
    
    if (!parentId || !studentId) {
      throw new BadRequestException('Parent ID and Student ID are required');
    }

    // First check current status to get Stripe subscription ID
    const currentStatus = await this.getStudentSubscriptionStatus(parentId, studentId);
    
    if (!currentStatus.hasSubscription || !currentStatus.subscriptionDetails?.id) {
      throw new NotFoundException('No subscription found for this student');
    }

    if (!currentStatus.isSetToCancel) {
      throw new BadRequestException('Subscription is not set to cancel');
    }

    if (!this.stripeService.isConfigured()) {
      throw new BadRequestException('Payment system is not configured');
    }

    try {
      // Reactivate the subscription in Stripe
      console.log(`🔄 Reactivating Stripe subscription: ${currentStatus.subscriptionDetails.id}`);
      const reactivatedSubscription = await this.stripeService.reactivateSubscription(currentStatus.subscriptionDetails.id);
      
      // Update our database
      const dbSubscription = await this.subscriptionRepository.findOne({
        where: { userId: parentId, studentId: studentId }
      });

      if (dbSubscription) {
        await this.subscriptionRepository.update(dbSubscription.id, {
          status: reactivatedSubscription.status,
          cancelAt: null, // Remove cancel date
          canceledAt: null
        });
      }

      console.log(`✅ Successfully reactivated subscription: ${currentStatus.subscriptionDetails.id}`);
      return {
        success: true,
        message: 'Subscription has been reactivated and will continue billing',
        subscriptionId: reactivatedSubscription.id
      };
    } catch (error) {
      console.error('❌ Error reactivating subscription:', error);
      throw new BadRequestException(`Failed to reactivate subscription: ${error.message}`);
    }
  }

  async fixWebhookTable() {
    try {
      console.log('🔧 Fixing webhook_events table schema...');
      
      // Drop and recreate the webhook_events table with correct schema
      await this.webhookEventRepository.query(`
        DROP TABLE IF EXISTS webhook_events;
        CREATE TABLE webhook_events (
          id uuid NOT NULL DEFAULT uuid_generate_v4(),
          stripe_event_id character varying(64) NOT NULL,
          type character varying(100) NOT NULL,
          payload jsonb NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT now(),
          CONSTRAINT UQ_webhook_events_stripe_event_id UNIQUE (stripe_event_id),
          CONSTRAINT PK_webhook_events PRIMARY KEY (id)
        );
      `);
      
      console.log('✅ Successfully fixed webhook_events table schema');
      return { success: true, message: 'Webhook events table schema fixed successfully' };
    } catch (error) {
      console.error('❌ Error fixing webhook table:', error);
      throw new BadRequestException(`Failed to fix webhook table: ${error.message}`);
    }
  }

  async addStudentNameColumns() {
    try {
      console.log('🔧 Adding student_name columns to payments tables...');
      
      // Add student_name column to subscriptions table
      await this.subscriptionRepository.query(`
        ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS student_name VARCHAR(255);
      `);
      
      // Add student_name column to invoices table
      await this.invoiceRepository.query(`
        ALTER TABLE invoices ADD COLUMN IF NOT EXISTS student_name VARCHAR(255);
      `);
      
      console.log('✅ Successfully added student_name columns');
      return { success: true, message: 'Student name columns added successfully' };
    } catch (error) {
      console.error('❌ Error adding student name columns:', error);
      throw new BadRequestException(`Failed to add student name columns: ${error.message}`);
    }
  }

  async populateStudentNames() {
    try {
      console.log('🔧 Populating student_name fields from existing data...');
      
      // Update subscriptions with student names
      const subscriptions = await this.subscriptionRepository
        .createQueryBuilder('subscription')
        .leftJoinAndSelect('subscription.student', 'student')
        .leftJoinAndSelect('student.user', 'user')
        .where('subscription.studentName IS NULL')
        .getMany();

      let updatedSubscriptions = 0;
      for (const subscription of subscriptions) {
        if (subscription.student?.user) {
          const studentName = `${subscription.student.user.firstName} ${subscription.student.user.lastName}`.trim();
          await this.subscriptionRepository.update(subscription.id, { studentName });
          updatedSubscriptions++;
        }
      }

      // Update invoices with student names
      const invoices = await this.invoiceRepository
        .createQueryBuilder('invoice')
        .leftJoinAndSelect('invoice.student', 'student')
        .leftJoinAndSelect('student.user', 'user')
        .where('invoice.studentName IS NULL')
        .getMany();

      let updatedInvoices = 0;
      for (const invoice of invoices) {
        if (invoice.student?.user) {
          const studentName = `${invoice.student.user.firstName} ${invoice.student.user.lastName}`.trim();
          await this.invoiceRepository.update(invoice.id, { studentName });
          updatedInvoices++;
        }
      }
      
      console.log(`✅ Successfully populated student names: ${updatedSubscriptions} subscriptions, ${updatedInvoices} invoices`);
      return { 
        success: true, 
        message: `Student names populated successfully: ${updatedSubscriptions} subscriptions, ${updatedInvoices} invoices` 
      };
    } catch (error) {
      console.error('❌ Error populating student names:', error);
      throw new BadRequestException(`Failed to populate student names: ${error.message}`);
    }
  }

  async handleCheckoutSessionSuccess(sessionId: string) {
    console.log(`🎉 Handling checkout session success: ${sessionId}`);
    
    try {
      if (!sessionId || typeof sessionId !== 'string') {
        throw new BadRequestException('Invalid session ID');
      }

      // Get the checkout session from Stripe
      const session = await this.stripeService.getCheckoutSession(sessionId);
      
      if (!session) {
        throw new BadRequestException('Checkout session not found');
      }

      console.log(`📋 Session details: payment_status=${session.payment_status}, mode=${session.mode}`);

      if (session.payment_status !== 'paid') {
        console.log(`⚠️ Payment not yet completed. Status: ${session.payment_status}`);
        return {
          success: false,
          message: `Payment not completed. Status: ${session.payment_status}`,
          sessionId: sessionId
        };
      }

      // Extract metadata
      const { parentId, studentId } = session.metadata || {};
      
      if (!parentId || !studentId) {
        console.error(`❌ Missing metadata in session: ${JSON.stringify(session.metadata)}`);
        throw new BadRequestException('Missing parentId or studentId in session metadata');
      }

      console.log(`📋 Processing successful payment for parent: ${parentId}, student: ${studentId}`);

      // Get subscription ID from metadata
      const subscriptionId = session.metadata?.subscriptionId;

      if (!subscriptionId) {
        console.error(`❌ Missing subscriptionId in metadata: ${JSON.stringify(session.metadata)}`);
        throw new BadRequestException('Missing subscriptionId in session metadata');
      }

      // Find the subscription record by ID (use StudentSubscription for new system)
      const subscription = await this.studentSubscriptionRepository.findOne({
        where: { id: subscriptionId }
      });

      if (!subscription) {
        throw new BadRequestException(`Subscription ${subscriptionId} not found`);
      }

      // Update the subscription record based on session mode
      const updateData: any = {
        stripeCustomerId: session.customer as string,
        studentName: session.metadata?.studentName || 'Unknown Student',
      };

      if (session.mode === 'subscription') {
        // Recurring subscription
        const stripeSubscription = session.subscription as any;

        if (stripeSubscription) {
          updateData.stripeSubscriptionId = stripeSubscription.id;
          updateData.status = stripeSubscription.status;
          updateData.amount = stripeSubscription.items?.data[0]?.price?.unit_amount || subscription.amount;
          updateData.currency = stripeSubscription.items?.data[0]?.price?.currency || subscription.currency;

          if (stripeSubscription.current_period_start) {
            updateData.currentPeriodStart = new Date(stripeSubscription.current_period_start * 1000);
          }
          if (stripeSubscription.current_period_end) {
            updateData.currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000);
          }
        }
      } else if (session.mode === 'payment') {
        // One-time payment
        updateData.status = 'active';
        updateData.isPaid = true;
        updateData.paidAt = new Date();
      }

      await this.studentSubscriptionRepository.update(subscription.id, updateData);

      // Create payment record (check if already exists from webhook)
      if (session.payment_intent) {
        const existingPayment = await this.paymentRepository.findOne({
          where: { stripePaymentIntentId: session.payment_intent as string }
        });

        if (!existingPayment) {
          const payment = this.paymentRepository.create({
            userId: parentId,
            studentId: studentId,
            studentName: session.metadata?.studentName || 'Unknown Student',
            planId: session.metadata?.planId,
            planName: subscription.planName,
            studentSubscriptionId: subscription.id,
            stripePaymentIntentId: session.payment_intent as string,
            paymentType: session.mode === 'subscription' ? PaymentType.SUBSCRIPTION : PaymentType.ONE_TIME,
            status: PaymentStatus.SUCCEEDED,
            amountPaid: session.amount_total || subscription.amount,
            currency: session.currency || subscription.currency,
            paidAt: new Date(),
          });

          await this.paymentRepository.save(payment);
          console.log(`💳 Created payment record for session: ${sessionId}`);
        } else {
          console.log(`⚠️ Payment record already exists for payment intent: ${session.payment_intent}, skipping creation`);
        }
      }

      // Store webhook event for audit
      await this.storeWebhookEvent({
        id: `manual_${sessionId.substring(0, 50)}`, // Truncate to fit 64 char limit
        type: 'checkout.session.completed',
        data: { object: session }
      });

      console.log(`✅ Successfully processed checkout session: ${sessionId}`);

      return {
        success: true,
        message: 'Payment processed successfully',
        subscriptionId: subscription.id,
        status: updateData.status || 'active'
      };

    } catch (error) {
      console.error('❌ Error handling checkout session success:', error);
      throw new BadRequestException(`Failed to process payment: ${error.message}`);
    }
  }

  // Admin payment management methods
  async getAdminPaymentStats() {
    try {
      // Get total revenue from invoices
      const totalRevenueResult = await this.invoiceRepository
        .createQueryBuilder('invoice')
        .select('SUM(invoice.amountPaid)', 'total')
        .where('invoice.status = :status', { status: 'paid' })
        .getRawOne();

      // Get active subscriptions count
      const activeSubscriptions = await this.subscriptionRepository.count({
        where: { status: 'active' }
      });

      // Get total invoices count
      const totalInvoices = await this.invoiceRepository.count();

      // Get monthly revenue (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const monthlyRevenueResult = await this.invoiceRepository
        .createQueryBuilder('invoice')
        .select('SUM(invoice.amountPaid)', 'total')
        .where('invoice.status = :status', { status: 'paid' })
        .andWhere('invoice.paidAt >= :date', { date: thirtyDaysAgo })
        .getRawOne();

      return {
        totalRevenue: parseInt(totalRevenueResult?.total || '0'),
        activeSubscriptions,
        totalInvoices,
        monthlyRevenue: parseInt(monthlyRevenueResult?.total || '0')
      };
    } catch (error) {
      console.error('Error getting admin payment stats:', error);
      throw new BadRequestException('Failed to get payment statistics');
    }
  }

  async getAdminSubscriptions(filters: any) {
    try {
      const query = this.subscriptionRepository
        .createQueryBuilder('subscription')
        .leftJoinAndSelect('subscription.student', 'student')
        .leftJoinAndSelect('student.user', 'user')
        .leftJoinAndSelect('subscription.user', 'parent')
        .orderBy('subscription.createdAt', 'DESC');

      // Apply filters
      if (filters.status && filters.status !== 'all') {
        query.andWhere('subscription.status = :status', { status: filters.status });
      }

      if (filters.dateRange) {
        const days = parseInt(filters.dateRange);
        const date = new Date();
        date.setDate(date.getDate() - days);
        query.andWhere('subscription.createdAt >= :date', { date });
      }

      if (filters.search) {
        query.andWhere(
          '(user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.email ILIKE :search OR parent.firstName ILIKE :search OR parent.lastName ILIKE :search OR parent.email ILIKE :search)',
          { search: `%${filters.search}%` }
        );
      }

      const subscriptions = await query.getMany();
      console.log('📊 Admin subscriptions query result:', subscriptions.length, 'subscriptions found');
      
      // Log first subscription for debugging
      if (subscriptions.length > 0) {
        console.log('📋 Sample subscription data:', JSON.stringify(subscriptions[0], null, 2));
      }

      return subscriptions;
    } catch (error) {
      console.error('Error getting admin subscriptions:', error);
      throw new BadRequestException('Failed to get subscriptions');
    }
  }

  async getAdminInvoices(filters: any) {
    try {
      const query = this.invoiceRepository
        .createQueryBuilder('invoice')
        .leftJoinAndSelect('invoice.student', 'student')
        .leftJoinAndSelect('student.user', 'user')
        .leftJoinAndSelect('invoice.user', 'parent')
        .orderBy('invoice.createdAt', 'DESC');

      // Apply filters
      if (filters.status && filters.status !== 'all') {
        query.andWhere('invoice.status = :status', { status: filters.status });
      }

      if (filters.dateRange) {
        const days = parseInt(filters.dateRange);
        const date = new Date();
        date.setDate(date.getDate() - days);
        query.andWhere('invoice.createdAt >= :date', { date });
      }

      if (filters.search) {
        query.andWhere(
          '(user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.email ILIKE :search OR parent.firstName ILIKE :search OR parent.lastName ILIKE :search OR parent.email ILIKE :search)',
          { search: `%${filters.search}%` }
        );
      }

      const invoices = await query.getMany();
      console.log('💳 Admin invoices query result:', invoices.length, 'invoices found');
      
      return invoices;
    } catch (error) {
      console.error('Error getting admin invoices:', error);
      throw new BadRequestException('Failed to get invoices');
    }
  }

  async getAdminWebhookEvents(filters: any) {
    try {
      const query = this.webhookEventRepository
        .createQueryBuilder('webhook')
        .orderBy('webhook.createdAt', 'DESC');

      // Apply filters
      if (filters.type && filters.type !== 'all') {
        query.andWhere('webhook.type = :type', { type: filters.type });
      }

      if (filters.dateRange) {
        const days = parseInt(filters.dateRange);
        const date = new Date();
        date.setDate(date.getDate() - days);
        query.andWhere('webhook.createdAt >= :date', { date });
      }

      if (filters.search) {
        query.andWhere(
          '(webhook.stripeEventId ILIKE :search OR webhook.type ILIKE :search)',
          { search: `%${filters.search}%` }
        );
      }

      return await query.getMany();
    } catch (error) {
      console.error('Error getting admin webhook events:', error);
      throw new BadRequestException('Failed to get webhook events');
    }
  }

  async getParentSubscriptions(parentId: string): Promise<Subscription[]> {
    return this.subscriptionRepository.find({
      where: { userId: parentId },
      relations: ['student', 'student.user'],
      order: { createdAt: 'DESC' }
    });
  }

  async getParentInvoices(parentId: string): Promise<Invoice[]> {
    return this.invoiceRepository.find({
      where: { userId: parentId },
      relations: ['student', 'student.user', 'subscription'],
      order: { createdAt: 'DESC' }
    });
  }

  async getStudentSubscriptionStatus(parentId: string, studentId: string) {
    console.log(`🔍 Checking subscription status for parentId: "${parentId}", studentId: "${studentId}"`);
    
    if (!parentId || !studentId) {
      throw new BadRequestException('Parent ID and Student ID are required');
    }

    // Get parent and student info
    const [parent, student] = await Promise.all([
      this.userRepository.findOne({ where: { id: parentId } }),
      this.userRepository.findOne({ where: { id: studentId } })
    ]);

    if (!parent || !student) {
      throw new NotFoundException('Parent or student not found');
    }

    let stripeSubscription = null;
    let subscriptionDetails = null;

    // FIRST: Check Stripe directly - this is the source of truth
    if (parent.stripe_customer_id && this.stripeService.isConfigured()) {
      try {
        console.log(`🔍 Checking Stripe for customer: ${parent.stripe_customer_id}`);
        
        // Get all subscriptions for this Stripe customer
        const stripeSubscriptions = await this.stripeService.getCustomerSubscriptions(parent.stripe_customer_id);
        console.log(`📊 Found ${stripeSubscriptions.length} Stripe subscriptions for customer`);
        
        // Find the subscription for this specific student
        const studentName = `${student.firstName} ${student.lastName}`;
        stripeSubscription = stripeSubscriptions.find(sub => 
          sub.metadata?.studentId === studentId || 
          sub.metadata?.studentName === studentName ||
          sub.metadata?.description?.includes(studentName)
        );

        if (stripeSubscription) {
          console.log(`✅ Found Stripe subscription: ${stripeSubscription.id} with status: ${stripeSubscription.status}`);
          
          subscriptionDetails = {
            id: stripeSubscription.id,
            status: stripeSubscription.status,
            currentPeriodStart: new Date((stripeSubscription as any).current_period_start * 1000),
            currentPeriodEnd: new Date((stripeSubscription as any).current_period_end * 1000),
            cancelAtPeriodEnd: (stripeSubscription as any).cancel_at_period_end,
            cancelAt: (stripeSubscription as any).cancel_at ? new Date((stripeSubscription as any).cancel_at * 1000) : null,
            amount: stripeSubscription.items?.data[0]?.price?.unit_amount || 0,
            currency: stripeSubscription.items?.data[0]?.price?.currency || 'usd'
          };

          // Update or create database record to match Stripe
          const dbSubscription = await this.subscriptionRepository.findOne({
            where: { userId: parentId, studentId: studentId }
          });

          if (dbSubscription) {
            // Update existing record
            if (dbSubscription.status !== stripeSubscription.status || !dbSubscription.stripeSubscriptionId) {
              console.log(`📝 Updating DB subscription from ${dbSubscription.status} to ${stripeSubscription.status}`);
              await this.subscriptionRepository.update(dbSubscription.id, {
                status: stripeSubscription.status,
                stripeSubscriptionId: stripeSubscription.id,
                stripeCustomerId: parent.stripe_customer_id,
                currentPeriodStart: subscriptionDetails.currentPeriodStart,
                currentPeriodEnd: subscriptionDetails.currentPeriodEnd,
                cancelAt: subscriptionDetails.cancelAt,
                amount: subscriptionDetails.amount,
                currency: subscriptionDetails.currency
              });
            }
          } else {
            // Create new database record from Stripe data
            console.log(`📝 Creating new DB subscription record for Stripe subscription: ${stripeSubscription.id}`);
            await this.subscriptionRepository.save({
              userId: parentId,
              studentId: studentId,
              stripeSubscriptionId: stripeSubscription.id,
              stripeCustomerId: parent.stripe_customer_id,
              status: stripeSubscription.status,
              currentPeriodStart: subscriptionDetails.currentPeriodStart,
              currentPeriodEnd: subscriptionDetails.currentPeriodEnd,
              cancelAt: subscriptionDetails.cancelAt,
              amount: subscriptionDetails.amount,
              currency: subscriptionDetails.currency
            });
          }
        } else {
          console.log(`⚠️ No Stripe subscription found for student ${studentId} (${studentName})`);
        }
      } catch (error) {
        console.error('❌ Error checking Stripe subscription:', error.message);
      }
    } else {
      console.log('⚠️ No Stripe customer ID or Stripe not configured');
    }

    // Determine the final status
    const hasStripeSubscription = !!stripeSubscription;
    const status = stripeSubscription?.status || 'none';
    const isActive = status === 'active' || status === 'trialing';
    const isSetToCancel = subscriptionDetails?.cancelAtPeriodEnd === true;
    const canSubscribe = !hasStripeSubscription || status === 'canceled' || status === 'none';
    const canCancel = hasStripeSubscription && isActive && !isSetToCancel;
    const canReactivate = hasStripeSubscription && isActive && isSetToCancel;

    const result = {
      hasSubscription: hasStripeSubscription,
      status,
      isActive,
      canSubscribe,
      canCancel,
      canReactivate,
      isSetToCancel,
      subscriptionDetails,
      stripeStatus: stripeSubscription?.status || null,
      studentName: `${student.firstName} ${student.lastName}`
    };

    console.log(`📊 Final status for student ${studentId}:`, {
      hasStripeSubscription,
      status,
      isActive,
      isSetToCancel,
      canSubscribe,
      canCancel,
      canReactivate,
      hasSubscriptionDetails: !!subscriptionDetails,
      subscriptionId: stripeSubscription?.id || 'none'
    });

    return result;
  }

  async getAllSubscriptions(): Promise<Subscription[]> {
    return this.subscriptionRepository.find({
      relations: ['user', 'student', 'student.user'],
      order: { createdAt: 'DESC' }
    });
  }

  async getSubscriptionStats(): Promise<any> {
    const [total, active, canceled, pastDue] = await Promise.all([
      this.subscriptionRepository.count(),
      this.subscriptionRepository.count({ where: { status: 'active' } }),
      this.subscriptionRepository.count({ where: { status: 'canceled' } }),
      this.subscriptionRepository.count({ where: { status: 'past_due' } }),
    ]);

    return {
      total,
      active,
      canceled,
      pastDue,
      revenue: await this.getTotalRevenue(),
    };
  }

  private async getTotalRevenue(): Promise<number> {
    const result = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .select('SUM(invoice.amountPaid)', 'total')
      .where('invoice.status = :status', { status: 'paid' })
      .getRawOne();

    return parseInt(result?.total || '0');
  }

  async handleStripeWebhook(event: any): Promise<void> {
    console.log(`🔄 Processing Stripe webhook: ${event.type} (${event.id})`);
    
    // Store webhook event for audit trail FIRST
    await this.storeWebhookEvent(event);
    
    try {
      switch (event.type) {
        case 'checkout.session.completed':
          console.log(`📋 Handling checkout.session.completed for session: ${event.data.object.id}`);
          await this.handleCheckoutSessionCompleted(event.data.object);
          break;
        case 'invoice.payment_succeeded':
          console.log(`💰 Handling invoice.payment_succeeded for invoice: ${event.data.object.id}`);
          await this.handleInvoicePaymentSucceeded(event.data.object);
          break;
        case 'invoice.payment_failed':
          console.log(`❌ Handling invoice.payment_failed for invoice: ${event.data.object.id}`);
          await this.handleInvoicePaymentFailed(event.data.object);
          break;
        case 'customer.subscription.updated':
          console.log(`🔄 Handling customer.subscription.updated for subscription: ${event.data.object.id}`);
          await this.handleSubscriptionChanged(event.data.object);
          break;
        case 'customer.subscription.deleted':
          console.log(`🗑️ Handling customer.subscription.deleted for subscription: ${event.data.object.id}`);
          await this.handleSubscriptionChanged(event.data.object);
          break;
        default:
          console.log(`⚠️ Unhandled webhook event type: ${event.type} (${event.id})`);
      }
      console.log(`✅ Successfully processed webhook: ${event.type} (${event.id})`);
    } catch (error) {
      console.error(`❌ Error processing webhook ${event.type} (${event.id}):`, error);
      throw error;
    }
  }

  private async handleCheckoutSessionCompleted(session: any): Promise<void> {
    console.log(`Checkout session completed: ${session.id}`);
    
    try {
      // Extract metadata from session
      const { parentId, studentId } = session.metadata || {};
      
      if (!parentId || !studentId) {
        console.error('Missing parentId or studentId in checkout session metadata');
        return;
      }

      // Find the subscription record we created earlier
      const subscription = await this.subscriptionRepository.findOne({
        where: { userId: parentId, studentId: studentId, status: 'incomplete' }
      });

      if (subscription) {
        try {
          // Try to get the subscription from Stripe (for production)
          const stripeSubscription = await this.stripeService.getSubscription(session.subscription);
          
          // Update our subscription record with Stripe data
          await this.subscriptionRepository.update(subscription.id, {
            stripeSubscriptionId: stripeSubscription.id,
            status: stripeSubscription.status,
            currentPeriodStart: new Date((stripeSubscription as any).current_period_start * 1000),
            currentPeriodEnd: new Date((stripeSubscription as any).current_period_end * 1000),
          });

          console.log(`✅ Updated subscription ${subscription.id} with real Stripe data`);
        } catch (stripeError) {
          // For development/testing with fake IDs, just mark as active
          console.log(`⚠️ Development mode: Using fake subscription data for ${session.subscription}`);
          
          await this.subscriptionRepository.update(subscription.id, {
            stripeSubscriptionId: session.subscription,
            status: 'active',
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          });

          console.log(`✅ Updated subscription ${subscription.id} with development data`);
        }
      } else {
        console.error(`No incomplete subscription found for parent ${parentId}, student ${studentId}`);
      }
    } catch (error) {
      console.error('Error handling checkout session completed:', error);
    }
  }

  private async handleInvoicePaymentSucceeded(invoice: any): Promise<void> {
    console.log(`Invoice payment succeeded: ${invoice.id}`);
    
    try {
      // Find subscription by stripe subscription ID
      const subscription = await this.subscriptionRepository.findOne({
        where: { stripeSubscriptionId: invoice.subscription }
      });

      if (subscription) {
        // Create or update invoice record
        await this.invoiceRepository.save({
          userId: subscription.userId,
          studentId: subscription.studentId,
          subscriptionId: subscription.id,
          stripeInvoiceId: invoice.id,
          stripeSubscriptionId: invoice.subscription,
          amountPaid: invoice.amount_paid,
          currency: invoice.currency,
          status: 'paid',
          paidAt: new Date(invoice.status_transitions.paid_at * 1000),
        });

        // Update subscription status
        await this.subscriptionRepository.update(subscription.id, {
          status: 'active'
        });
      }
    } catch (error) {
      console.error('Error handling invoice payment succeeded:', error);
    }
  }

  private async handleInvoicePaymentFailed(invoice: any): Promise<void> {
    console.log(`Invoice payment failed: ${invoice.id}`);
    
    try {
      const subscription = await this.subscriptionRepository.findOne({
        where: { stripeSubscriptionId: invoice.subscription }
      });

      if (subscription) {
        // Update subscription status
        await this.subscriptionRepository.update(subscription.id, {
          status: 'past_due'
        });
      }
    } catch (error) {
      console.error('Error handling invoice payment failed:', error);
    }
  }

  private async handleSubscriptionChanged(stripeSubscription: any): Promise<void> {
    console.log(`Subscription changed: ${stripeSubscription.id}, status: ${stripeSubscription.status}`);
    
    try {
      const subscription = await this.subscriptionRepository.findOne({
        where: { stripeSubscriptionId: stripeSubscription.id }
      });

      if (subscription) {
        const updateData: any = {
          status: stripeSubscription.status,
          currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
          currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        };

        if (stripeSubscription.cancel_at) {
          updateData.cancelAt = new Date(stripeSubscription.cancel_at * 1000);
        }

        if (stripeSubscription.canceled_at) {
          updateData.canceledAt = new Date(stripeSubscription.canceled_at * 1000);
        }

        await this.subscriptionRepository.update(subscription.id, updateData);
      }
    } catch (error) {
      console.error('Error handling subscription change:', error);
    }
  }

  private async storeWebhookEvent(event: any): Promise<void> {
    try {
      console.log(`📝 Storing webhook event: ${event.type} (${event.id})`);

      // Check if event already exists
      const existingEvent = await this.webhookEventRepository.findOne({
        where: { stripeEventId: event.id }
      });

      if (!existingEvent) {
        const webhookEvent = await this.webhookEventRepository.save({
          stripeEventId: event.id,
          type: event.type,
          payload: event,
        });
        console.log(`✅ Successfully stored webhook event: ${event.type} (${event.id}) with ID: ${webhookEvent.id}`);
      } else {
        console.log(`⚠️ Webhook event already exists: ${event.type} (${event.id})`);
      }
    } catch (error) {
      // Ignore duplicate key errors (race condition)
      if (error.code === '23505' || error.message?.includes('duplicate key')) {
        console.log(`⚠️ Webhook event ${event.id} already processed (duplicate), skipping`);
        return;
      }
      console.error('❌ Failed to store webhook event:', error);
      console.error('Event details:', { id: event.id, type: event.type });
      // Don't throw error - webhook event storage is for audit, shouldn't fail the main operation
    }
  }

  // New methods for real-time Stripe data
  async getStripeSubscriptions(filters: any = {}) {
    try {
      console.log('🔍 Fetching all subscriptions from Stripe API...');
      
      // Get all subscriptions from Stripe
      const stripeSubscriptions = await this.stripeService.getAllSubscriptions(100);
      console.log(`📊 Found ${stripeSubscriptions.length} subscriptions in Stripe`);

      // Get all users from database for cross-reference
      const users = await this.userRepository.find({
        select: ['id', 'email', 'firstName', 'lastName', 'stripe_customer_id']
      });

      // Create a map of Stripe customer IDs to users
      const customerToUserMap = new Map();
      users.forEach(user => {
        if (user.stripe_customer_id) {
          customerToUserMap.set(user.stripe_customer_id, user);
        }
      });

      // Collect unique product IDs
      const productIds = new Set<string>();
      stripeSubscriptions.forEach(stripeSub => {
        const productId = stripeSub.items.data[0]?.price?.product;
        if (typeof productId === 'string') {
          productIds.add(productId);
        }
      });

      // Fetch all products in parallel
      const productMap = new Map<string, string>();
      await Promise.all(
        Array.from(productIds).map(async (productId) => {
          try {
            const product = await this.stripeService['stripe'].products.retrieve(productId);
            productMap.set(productId, product.name);
          } catch (error) {
            console.warn(`⚠️ Failed to fetch product ${productId}: ${error.message}`);
          }
        })
      );

      // Process subscriptions and flag mismatches
      const processedSubscriptions = stripeSubscriptions.map(stripeSub => {
        const customerId = typeof stripeSub.customer === 'string'
          ? stripeSub.customer
          : stripeSub.customer?.id;

        const matchedUser = customerToUserMap.get(customerId);

        // Get student name from metadata or matched user
        let studentName = stripeSub.metadata?.studentName;
        if (!studentName && matchedUser) {
          // Use parent name as fallback for student name
          studentName = `${matchedUser.firstName} ${matchedUser.lastName}`;
        }

        // Cast to any to handle TypeScript strict typing
        const stripeSubAny = stripeSub as any;
        const customerAny = stripeSub.customer as any;

        // Get plan/product information from Stripe
        const priceData = stripeSub.items.data[0]?.price;
        const productId = priceData?.product;

        let planName = stripeSub.metadata?.planName || 'Unknown Plan';
        let planInterval = 'one_time';
        let planType = 'one_time';

        if (priceData) {
          const priceAny = priceData as any;
          planInterval = priceAny.recurring?.interval || 'one_time';
          planType = priceAny.type || 'one_time';

          // Get product name from our fetched map
          if (typeof productId === 'string' && productMap.has(productId)) {
            planName = productMap.get(productId) || planName;
          }
        }

        // Debug logging for first subscription
        if (stripeSub.id === stripeSubscriptions[0]?.id) {
          console.log('🔍 DEBUG - Sample Stripe subscription data:', {
            id: stripeSub.id,
            status: stripeSub.status,
            current_period_start: stripeSubAny.current_period_start,
            current_period_end: stripeSubAny.current_period_end,
            trial_end: stripeSubAny.trial_end,
            cancel_at: stripeSubAny.cancel_at,
            planInterval: planInterval,
            planType: planType,
          });
        }

        return {
          id: stripeSub.id,
          customerId,
          studentName: studentName || 'Unknown Student',
          parentEmail: typeof stripeSub.customer === 'object'
            ? customerAny?.email
            : matchedUser?.email || 'Unknown Email',
          parentName: matchedUser
            ? `${matchedUser.firstName} ${matchedUser.lastName}`
            : 'Unknown Parent',
          status: stripeSub.status,
          amount: stripeSub.items.data[0]?.price?.unit_amount || 0,
          currency: stripeSub.items.data[0]?.price?.currency || 'usd',
          currentPeriodStart: stripeSubAny.current_period_start ? new Date(stripeSubAny.current_period_start * 1000) : null,
          currentPeriodEnd: stripeSubAny.current_period_end ? new Date(stripeSubAny.current_period_end * 1000) : null,
          trialEnd: stripeSubAny.trial_end ? new Date(stripeSubAny.trial_end * 1000) : null,
          cancelAt: stripeSubAny.cancel_at ? new Date(stripeSubAny.cancel_at * 1000) : null,
          cancelAtPeriodEnd: stripeSubAny.cancel_at_period_end,
          createdAt: new Date(stripeSub.created * 1000),
          // Plan information
          planName,
          planInterval,
          planType,
          priceId: priceData?.id || null,
          productId: typeof productId === 'string' ? productId : null,
          // Flag for mismatch
          hasDbMismatch: !matchedUser,
          dbMatchedUser: matchedUser,
          stripeData: stripeSub
        };
      });

      console.log(`✅ Processed ${processedSubscriptions.length} subscriptions with database cross-reference`);
      
      return {
        total: processedSubscriptions.length,
        mismatches: processedSubscriptions.filter(sub => sub.hasDbMismatch).length,
        subscriptions: processedSubscriptions
      };
    } catch (error) {
      console.error('❌ Failed to fetch Stripe subscriptions:', error);
      throw new Error(`Failed to fetch Stripe subscriptions: ${error.message}`);
    }
  }

  async getStripeInvoices(filters: any = {}) {
    try {
      console.log('🔍 Fetching all invoices from Stripe API...');
      
      // Get all invoices from Stripe
      const stripeInvoices = await this.stripeService.getAllInvoices(100);
      console.log(`📊 Found ${stripeInvoices.length} invoices in Stripe`);

      // Get all users from database for cross-reference
      const users = await this.userRepository.find({
        select: ['id', 'email', 'firstName', 'lastName', 'stripe_customer_id']
      });

      // Create a map of Stripe customer IDs to users
      const customerToUserMap = new Map();
      users.forEach(user => {
        if (user.stripe_customer_id) {
          customerToUserMap.set(user.stripe_customer_id, user);
        }
      });

      // Process invoices and flag mismatches
      const processedInvoices = stripeInvoices.map(stripeInvoice => {
        const customerId = typeof stripeInvoice.customer === 'string' 
          ? stripeInvoice.customer 
          : stripeInvoice.customer?.id;
        
        const matchedUser = customerToUserMap.get(customerId);
        
        // Cast to any to handle TypeScript strict typing
        const invoiceAny = stripeInvoice as any;
        const customerAny = stripeInvoice.customer as any;
        
        // Get student name from subscription metadata or matched user
        let studentName = invoiceAny.subscription?.metadata?.studentName;
        if (!studentName && matchedUser) {
          studentName = `${matchedUser.firstName} ${matchedUser.lastName}`;
        }

        return {
          id: stripeInvoice.id,
          customerId,
          studentName: studentName || 'Unknown Student',
          parentEmail: typeof stripeInvoice.customer === 'object' 
            ? customerAny?.email 
            : matchedUser?.email || 'Unknown Email',
          parentName: matchedUser 
            ? `${matchedUser.firstName} ${matchedUser.lastName}` 
            : 'Unknown Parent',
          status: stripeInvoice.status,
          amount: stripeInvoice.amount_paid || stripeInvoice.amount_due || 0,
          currency: stripeInvoice.currency || 'usd',
          paidAt: stripeInvoice.status_transitions?.paid_at 
            ? new Date(stripeInvoice.status_transitions.paid_at * 1000) 
            : null,
          dueDate: stripeInvoice.due_date ? new Date(stripeInvoice.due_date * 1000) : null,
          createdAt: new Date(stripeInvoice.created * 1000),
          subscriptionId: typeof invoiceAny.subscription === 'string' 
            ? invoiceAny.subscription 
            : invoiceAny.subscription?.id,
          // Flag for mismatch
          hasDbMismatch: !matchedUser,
          dbMatchedUser: matchedUser,
          stripeData: stripeInvoice
        };
      });

      console.log(`✅ Processed ${processedInvoices.length} invoices with database cross-reference`);
      
      return {
        total: processedInvoices.length,
        mismatches: processedInvoices.filter(invoice => invoice.hasDbMismatch).length,
        invoices: processedInvoices
      };
    } catch (error) {
      console.error('❌ Failed to fetch Stripe invoices:', error);
      throw new Error(`Failed to fetch Stripe invoices: ${error.message}`);
    }
  }

  async getStripeStats() {
    try {
      console.log('📊 Calculating Stripe statistics...');
      
      // Get data from both endpoints
      const [subscriptionsData, invoicesData] = await Promise.all([
        this.getStripeSubscriptions(),
        this.getStripeInvoices()
      ]);

      const activeSubscriptions = subscriptionsData.subscriptions.filter(sub => sub.status === 'active').length;
      const canceledSubscriptions = subscriptionsData.subscriptions.filter(sub => sub.status === 'canceled').length;
      const incompleteSubscriptions = subscriptionsData.subscriptions.filter(sub => sub.status === 'incomplete').length;
      
      const paidInvoices = invoicesData.invoices.filter(inv => inv.status === 'paid').length;
      const unpaidInvoices = invoicesData.invoices.filter(inv => inv.status === 'open').length;
      
      const totalRevenue = invoicesData.invoices
        .filter(inv => inv.status === 'paid')
        .reduce((sum, inv) => sum + inv.amount, 0);

      const monthlyRevenue = invoicesData.invoices
        .filter(inv => {
          const oneMonthAgo = new Date();
          oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
          return inv.status === 'paid' && inv.paidAt && inv.paidAt >= oneMonthAgo;
        })
        .reduce((sum, inv) => sum + inv.amount, 0);

      return {
        subscriptions: {
          total: subscriptionsData.total,
          active: activeSubscriptions,
          canceled: canceledSubscriptions,
          incomplete: incompleteSubscriptions,
          mismatches: subscriptionsData.mismatches
        },
        invoices: {
          total: invoicesData.total,
          paid: paidInvoices,
          unpaid: unpaidInvoices,
          mismatches: invoicesData.mismatches
        },
        revenue: {
          total: totalRevenue,
          monthly: monthlyRevenue,
          currency: 'usd'
        },
        dataMismatches: {
          totalSubscriptionMismatches: subscriptionsData.mismatches,
          totalInvoiceMismatches: invoicesData.mismatches,
          description: 'Records in Stripe that don\'t match any user in your database'
        }
      };
    } catch (error) {
      console.error('❌ Failed to calculate Stripe stats:', error);
      throw new Error(`Failed to calculate Stripe stats: ${error.message}`);
    }
  }

  async syncStripeDataToDatabase(customerIds?: string[]) {
    try {
      console.log('🔄 Starting sync of Stripe data to database...');
      
      // Get all Stripe customers
      const stripeCustomers = await this.stripeService.getAllCustomers(100);
      console.log(`📊 Found ${stripeCustomers.length} customers in Stripe`);

      // Filter to only unmatched customers if specific IDs provided
      let customersToSync = stripeCustomers;
      if (customerIds && customerIds.length > 0) {
        customersToSync = stripeCustomers.filter(customer => 
          customerIds.includes(customer.id)
        );
        console.log(`🎯 Syncing ${customersToSync.length} specific customers`);
      } else {
        // Get all existing users to find unmatched customers
        const existingUsers = await this.userRepository.find({
          select: ['stripe_customer_id']
        });
        const existingStripeIds = existingUsers
          .map(user => user.stripe_customer_id)
          .filter(id => id);
        
        customersToSync = stripeCustomers.filter(customer => 
          !existingStripeIds.includes(customer.id)
        );
        console.log(`🔄 Found ${customersToSync.length} unmatched customers to sync`);
      }

      const syncResults = {
        customersCreated: 0,
        subscriptionsCreated: 0,
        errors: []
      };

      // Process each customer
      for (const stripeCustomer of customersToSync) {
        try {
          // Create user record
          const newUser = this.userRepository.create({
            firstName: stripeCustomer.name?.split(' ')[0] || 'Unknown',
            lastName: stripeCustomer.name?.split(' ').slice(1).join(' ') || 'Customer',
            email: stripeCustomer.email || `stripe_${stripeCustomer.id}@example.com`,
            passwordHash: 'SYNCED_FROM_STRIPE', // Placeholder password
            role: Role.Parent, // Default to parent role
            stripe_customer_id: stripeCustomer.id,
            createdAt: new Date()
          });

          const savedUser = await this.userRepository.save(newUser);
          syncResults.customersCreated++;

          console.log(`✅ Created user for Stripe customer: ${stripeCustomer.id}`);

          // Get customer's subscriptions
          const customerSubscriptions = await this.stripeService.getCustomerSubscriptions(stripeCustomer.id);
          
          for (const stripeSubscription of customerSubscriptions) {
            try {
              // Cast to any to handle TypeScript strict typing
              const stripeSubAny = stripeSubscription as any;
              
              // Create subscription record
              const newSubscription = this.subscriptionRepository.create({
                userId: savedUser.id,
                stripeSubscriptionId: stripeSubscription.id,
                status: stripeSubscription.status,
                amount: stripeSubscription.items.data[0]?.price?.unit_amount || 0,
                currency: stripeSubscription.items.data[0]?.price?.currency || 'usd',
                currentPeriodStart: stripeSubAny.current_period_start 
                  ? new Date(stripeSubAny.current_period_start * 1000) 
                  : null,
                currentPeriodEnd: stripeSubAny.current_period_end 
                  ? new Date(stripeSubAny.current_period_end * 1000) 
                  : null,
                cancelAt: stripeSubAny.cancel_at 
                  ? new Date(stripeSubAny.cancel_at * 1000) 
                  : null,
                canceledAt: stripeSubAny.canceled_at 
                  ? new Date(stripeSubAny.canceled_at * 1000) 
                  : null,
                stripeCustomerId: stripeCustomer.id,
                studentName: stripeSubscription.metadata?.studentName || `${savedUser.firstName} ${savedUser.lastName}`,
                createdAt: new Date(stripeSubscription.created * 1000),
                updatedAt: new Date()
              });

              await this.subscriptionRepository.save(newSubscription);
              syncResults.subscriptionsCreated++;

              console.log(`✅ Created subscription: ${stripeSubscription.id}`);
            } catch (subscriptionError) {
              console.error(`❌ Failed to create subscription ${stripeSubscription.id}:`, subscriptionError);
              syncResults.errors.push({
                type: 'subscription',
                id: stripeSubscription.id,
                error: subscriptionError.message
              });
            }
          }

        } catch (customerError) {
          console.error(`❌ Failed to create customer ${stripeCustomer.id}:`, customerError);
          syncResults.errors.push({
            type: 'customer',
            id: stripeCustomer.id,
            error: customerError.message
          });
        }
      }

      console.log(`✅ Sync completed: ${syncResults.customersCreated} customers, ${syncResults.subscriptionsCreated} subscriptions`);
      
      return {
        success: true,
        message: `Successfully synced ${syncResults.customersCreated} customers and ${syncResults.subscriptionsCreated} subscriptions`,
        results: syncResults
      };

    } catch (error) {
      console.error('❌ Failed to sync Stripe data:', error);
      throw new Error(`Failed to sync Stripe data: ${error.message}`);
    }
  }
}