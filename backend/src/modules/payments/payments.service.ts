import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WebhookEvent } from './entities/webhook-event.entity';
import { Invoice } from './entities/invoice.entity';
import { Subscription } from './entities/subscription.entity';
import { Student } from '../students/entities/student.entity';
import { User } from '../users/entities/user.entity';
import { StripeService } from '../../common/services/stripe.service';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(WebhookEvent)
    private webhookEventRepository: Repository<WebhookEvent>,
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private stripeService: StripeService,
  ) {}

  // WebhookEvent methods
  async createWebhookEvent(data: Partial<WebhookEvent>): Promise<WebhookEvent> {
    const webhookEvent = this.webhookEventRepository.create(data);
    return this.webhookEventRepository.save(webhookEvent);
  }

  async findWebhookEventByStripeId(stripeEventId: string): Promise<WebhookEvent | null> {
    return this.webhookEventRepository.findOne({
      where: { stripeEventId },
    });
  }

  // Invoice methods
  async createInvoice(data: Partial<Invoice>): Promise<Invoice> {
    const invoice = this.invoiceRepository.create(data);
    return this.invoiceRepository.save(invoice);
  }

  async findInvoicesByUserId(userId: string): Promise<Invoice[]> {
    return this.invoiceRepository.find({
      where: { userId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findInvoiceByStripeId(stripeInvoiceId: string): Promise<Invoice | null> {
    return this.invoiceRepository.findOne({
      where: { stripeInvoiceId },
      relations: ['user'],
    });
  }

  // Subscription methods
  async createSubscription(data: Partial<Subscription>): Promise<Subscription> {
    const subscription = this.subscriptionRepository.create(data);
    return this.subscriptionRepository.save(subscription);
  }

  async updateSubscription(id: string, data: Partial<Subscription>): Promise<Subscription> {
    await this.subscriptionRepository.update(id, data);
    return this.subscriptionRepository.findOne({
      where: { id },
      relations: ['user'],
    });
  }

  async findSubscriptionByUserId(userId: string): Promise<Subscription | null> {
    return this.subscriptionRepository.findOne({
      where: { userId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findSubscriptionByStripeId(stripeSubscriptionId: string): Promise<Subscription | null> {
    return this.subscriptionRepository.findOne({
      where: { stripeSubscriptionId },
      relations: ['user'],
    });
  }

  // New Stripe integration methods for student subscriptions
  async createStudentSubscription(parentId: string, studentId: string): Promise<{
    subscription: Subscription;
    clientSecret: string;
  }> {
    // Validate parent and student
    const parent = await this.userRepository.findOne({ where: { id: parentId } });
    if (!parent) {
      throw new NotFoundException('Parent not found');
    }

    const student = await this.studentRepository.findOne({ 
      where: { id: studentId },
      relations: ['user']
    });
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Check if student already has an active subscription
    const existingSubscription = await this.subscriptionRepository.findOne({
      where: { 
        studentId, 
        status: 'active'
      }
    });

    if (existingSubscription) {
      throw new BadRequestException('Student already has an active subscription');
    }

    try {
      // Create or get Stripe customer
      let stripeCustomer;
      try {
        // Try to find existing customer by email
        stripeCustomer = await this.stripeService.createCustomer(
          parent.email,
          parent.firstName + ' ' + parent.lastName,
          {
            userId: parentId,
            studentId: studentId,
            studentName: student.user.firstName + ' ' + student.user.lastName,
          }
        );
      } catch (error) {
        throw new BadRequestException('Failed to create customer');
      }

      // Create Stripe subscription
      const stripeSubscription = await this.stripeService.createSubscription(
        stripeCustomer.id,
        undefined, // Use default monthly price
        {
          studentId: studentId,
          parentId: parentId,
          studentName: student.user.firstName + ' ' + student.user.lastName,
        }
      );

      // Create local subscription record
      const subscription = await this.createSubscription({
        userId: parentId,
        studentId: studentId,
        stripeSubscriptionId: stripeSubscription.id,
        stripeCustomerId: stripeCustomer.id,
        stripePriceId: this.stripeService.getMonthlyPriceInfo().priceId,
        status: stripeSubscription.status,
        currentPeriodStart: new Date((stripeSubscription as any).current_period_start * 1000),
        currentPeriodEnd: new Date((stripeSubscription as any).current_period_end * 1000),
        amount: stripeSubscription.items.data[0].price.unit_amount || 0,
        currency: stripeSubscription.items.data[0].price.currency || 'usd',
      });

      // Update student subscription status
      await this.studentRepository.update(studentId, {
        subscriptionStatus: 'incomplete',
        subscriptionEndDate: new Date((stripeSubscription as any).current_period_end * 1000),
      });

      // Get client secret from the payment intent
      const latestInvoice = stripeSubscription.latest_invoice as any;
      const clientSecret = latestInvoice?.payment_intent?.client_secret;

      return {
        subscription,
        clientSecret,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to create subscription: ${error.message}`);
    }
  }

  async cancelStudentSubscription(parentId: string, studentId: string): Promise<Subscription> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { 
        userId: parentId,
        studentId: studentId,
        status: 'active'
      }
    });

    if (!subscription) {
      throw new NotFoundException('Active subscription not found');
    }

    try {
      // Cancel in Stripe
      const stripeSubscription = await this.stripeService.cancelSubscription(
        subscription.stripeSubscriptionId,
        true // Cancel at period end
      );

      // Update local subscription
      const updatedSubscription = await this.updateSubscription(subscription.id, {
        status: stripeSubscription.status,
        cancelAt: stripeSubscription.cancel_at ? new Date(stripeSubscription.cancel_at * 1000) : null,
      });

      // Update student status if subscription is immediately cancelled
      if (stripeSubscription.status === 'canceled') {
        await this.studentRepository.update(studentId, {
          subscriptionStatus: 'canceled',
        });
      }

      return updatedSubscription;
    } catch (error) {
      throw new BadRequestException(`Failed to cancel subscription: ${error.message}`);
    }
  }

  async reactivateStudentSubscription(parentId: string, studentId: string): Promise<Subscription> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { 
        userId: parentId,
        studentId: studentId
      }
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    try {
      // Reactivate in Stripe
      const stripeSubscription = await this.stripeService.reactivateSubscription(
        subscription.stripeSubscriptionId
      );

      // Update local subscription
      const updatedSubscription = await this.updateSubscription(subscription.id, {
        status: stripeSubscription.status,
        cancelAt: null,
      });

      // Update student status
      await this.studentRepository.update(studentId, {
        subscriptionStatus: stripeSubscription.status,
      });

      return updatedSubscription;
    } catch (error) {
      throw new BadRequestException(`Failed to reactivate subscription: ${error.message}`);
    }
  }

  async getParentSubscriptions(parentId: string): Promise<Subscription[]> {
    return this.subscriptionRepository.find({
      where: { userId: parentId },
      relations: ['student', 'student.user'],
      order: { createdAt: 'DESC' },
    });
  }

  async getStudentSubscription(studentId: string): Promise<Subscription | null> {
    return this.subscriptionRepository.findOne({
      where: { studentId },
      relations: ['user', 'student', 'student.user'],
      order: { createdAt: 'DESC' },
    });
  }

  async getParentInvoices(parentId: string): Promise<Invoice[]> {
    return this.invoiceRepository.find({
      where: { userId: parentId },
      relations: ['student', 'student.user', 'subscription'],
      order: { createdAt: 'DESC' },
    });
  }

  async getStudentInvoices(studentId: string): Promise<Invoice[]> {
    return this.invoiceRepository.find({
      where: { studentId },
      relations: ['user', 'student', 'student.user', 'subscription'],
      order: { createdAt: 'DESC' },
    });
  }

  // Admin methods
  async getAllSubscriptions(): Promise<Subscription[]> {
    return this.subscriptionRepository.find({
      relations: ['user', 'student', 'student.user'],
      order: { createdAt: 'DESC' },
    });
  }

  async getSubscriptionStats(): Promise<{
    total: number;
    active: number;
    canceled: number;
    pastDue: number;
    revenue: number;
  }> {
    const [total, active, canceled, pastDue] = await Promise.all([
      this.subscriptionRepository.count(),
      this.subscriptionRepository.count({ where: { status: 'active' } }),
      this.subscriptionRepository.count({ where: { status: 'canceled' } }),
      this.subscriptionRepository.count({ where: { status: 'past_due' } }),
    ]);

    // Calculate total revenue from paid invoices
    const paidInvoices = await this.invoiceRepository.find({
      where: { status: 'paid' }
    });
    const revenue = paidInvoices.reduce((sum, invoice) => sum + invoice.amountPaid, 0);

    return {
      total,
      active,
      canceled,
      pastDue,
      revenue: revenue / 100, // Convert from cents to dollars
    };
  }

  // Webhook handling
  async handleStripeWebhook(event: any): Promise<void> {
    // Check if we've already processed this event
    const existingEvent = await this.findWebhookEventByStripeId(event.id);
    if (existingEvent) {
      return; // Already processed
    }

    // Log the event
    await this.createWebhookEvent({
      stripeEventId: event.id,
      type: event.type,
      payload: event,
    });

    try {
      switch (event.type) {
        case 'invoice.payment_succeeded':
          await this.handleInvoicePaymentSucceeded(event.data.object);
          break;
        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailed(event.data.object);
          break;
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object);
          break;
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object);
          break;
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      // Event processing completed successfully
      console.log(`✅ Successfully processed webhook: ${event.id}`);
    } catch (error) {
      console.error(`Error processing webhook ${event.id}:`, error);
      throw error;
    }
  }

  private async handleInvoicePaymentSucceeded(invoice: any): Promise<void> {
    // Create or update invoice record
    const existingInvoice = await this.findInvoiceByStripeId(invoice.id);
    
    if (!existingInvoice) {
      // Find subscription to get student info
      const subscription = await this.findSubscriptionByStripeId(invoice.subscription);
      
      if (subscription) {
        await this.createInvoice({
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

        // Update student subscription status
        await this.studentRepository.update(subscription.studentId, {
          subscriptionStatus: 'active',
        });
      }
    }
  }

  private async handleInvoicePaymentFailed(invoice: any): Promise<void> {
    const subscription = await this.findSubscriptionByStripeId(invoice.subscription);
    
    if (subscription) {
      // Update student subscription status
      await this.studentRepository.update(subscription.studentId, {
        subscriptionStatus: 'past_due',
      });
    }
  }

  private async handleSubscriptionUpdated(subscription: any): Promise<void> {
    const localSubscription = await this.findSubscriptionByStripeId(subscription.id);
    
    if (localSubscription) {
      await this.updateSubscription(localSubscription.id, {
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAt: subscription.cancel_at ? new Date(subscription.cancel_at * 1000) : null,
        canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
      });

      // Update student subscription status
      await this.studentRepository.update(localSubscription.studentId, {
        subscriptionStatus: subscription.status,
        subscriptionEndDate: new Date(subscription.current_period_end * 1000),
      });
    }
  }

  private async handleSubscriptionDeleted(subscription: any): Promise<void> {
    const localSubscription = await this.findSubscriptionByStripeId(subscription.id);
    
    if (localSubscription) {
      await this.updateSubscription(localSubscription.id, {
        status: 'canceled',
        canceledAt: new Date(),
      });

      // Update student subscription status
      await this.studentRepository.update(localSubscription.studentId, {
        subscriptionStatus: 'canceled',
      });
    }
  }
}
