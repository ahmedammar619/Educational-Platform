import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Student } from '../students/entities/student.entity';
import { WebhookEvent } from './entities/webhook-event.entity';
import { Subscription } from './entities/subscription.entity';
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
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
    private stripeService: StripeService,
  ) {}

  async createStudentSubscription(parentId: string, studentId: string): Promise<{
    checkoutUrl: string;
  }> {
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

    // Check if subscription already exists
    const existingSubscription = await this.subscriptionRepository.findOne({
      where: { userId: parentId, studentId: studentId }
    });

    if (existingSubscription && ['active', 'trialing', 'incomplete'].includes(existingSubscription.status)) {
      throw new BadRequestException('An active subscription already exists for this student');
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
        await this.userRepository.update(parentId, { 
          stripe_customer_id: stripeCustomer.id 
        });
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

      return { checkoutUrl: checkoutSession.url };
    } catch (error) {
      throw new BadRequestException(`Failed to create subscription: ${error.message}`);
    }
  }

  async cancelStudentSubscription(parentId: string, studentId: string): Promise<void> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { userId: parentId, studentId: studentId }
    });

    if (!subscription) {
      throw new NotFoundException('No active subscription found');
    }

    try {
      await this.stripeService.cancelSubscription(subscription.stripeSubscriptionId);
      
      // Update local record
      await this.subscriptionRepository.update(subscription.id, {
        status: 'canceled',
        canceledAt: new Date(),
      });
    } catch (error) {
      throw new BadRequestException(`Failed to cancel subscription: ${error.message}`);
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
    console.log(`Processing Stripe webhook: ${event.type}`);
    
    // Store webhook event for audit trail
    await this.storeWebhookEvent(event);
    
    try {
      switch (event.type) {
        case 'invoice.payment_succeeded':
          await this.handleInvoicePaymentSucceeded(event.data.object);
          break;
        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailed(event.data.object);
          break;
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
          await this.handleSubscriptionChanged(event.data.object);
          break;
        default:
          console.log(`Unhandled webhook event type: ${event.type}`);
      }
    } catch (error) {
      console.error(`Error processing webhook ${event.type}:`, error);
      throw error;
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
      // Check if event already exists
      const existingEvent = await this.webhookEventRepository.findOne({
        where: { stripeEventId: event.id }
      });

      if (!existingEvent) {
        await this.webhookEventRepository.save({
          stripeEventId: event.id,
          type: event.type,
          payload: event,
        });
        console.log(`Stored webhook event: ${event.type} (${event.id})`);
      }
    } catch (error) {
      console.error('Failed to store webhook event:', error);
    }
  }
}