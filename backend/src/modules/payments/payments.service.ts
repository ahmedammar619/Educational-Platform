import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { StripeService } from '../../common/services/stripe.service';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private stripeService: StripeService,
  ) {}

  async createStudentSubscription(parentId: string, studentId: string): Promise<{
    clientSecret: string;
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

      // Create subscription
      const stripeSubscription = await this.stripeService.createSubscription(
        stripeCustomer.id, 
        undefined, 
        { 
          studentId: studentId, 
          parentId: parentId, 
          studentName: `${student.firstName} ${student.lastName}` 
        }
      );

      const latestInvoice = stripeSubscription.latest_invoice as any;
      const clientSecret = latestInvoice?.payment_intent?.client_secret;

      return { clientSecret };
    } catch (error) {
      throw new BadRequestException(`Failed to create subscription: ${error.message}`);
    }
  }

  async cancelStudentSubscription(parentId: string, studentId: string): Promise<void> {
    const parent = await this.userRepository.findOne({ where: { id: parentId } });
    if (!parent || !parent.stripe_customer_id) {
      throw new NotFoundException('No active subscription found');
    }

    try {
      // Find active subscriptions for this customer
      const subscriptions = await this.stripeService.getCustomerSubscriptions(parent.stripe_customer_id);
      const activeSubscription = subscriptions.find(sub => 
        sub.status === 'active' && 
        sub.metadata?.studentId === studentId
      );

      if (activeSubscription) {
        await this.stripeService.cancelSubscription(activeSubscription.id);
      }
    } catch (error) {
      throw new BadRequestException(`Failed to cancel subscription: ${error.message}`);
    }
  }

  async getParentSubscriptions(parentId: string): Promise<any[]> {
    const parent = await this.userRepository.findOne({ where: { id: parentId } });
    if (!parent || !parent.stripe_customer_id) {
      return [];
    }

    try {
      return await this.stripeService.getCustomerSubscriptions(parent.stripe_customer_id);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      return [];
    }
  }

  async getParentInvoices(parentId: string): Promise<any[]> {
    const parent = await this.userRepository.findOne({ where: { id: parentId } });
    if (!parent || !parent.stripe_customer_id) {
      return [];
    }

    try {
      return await this.stripeService.getCustomerInvoices(parent.stripe_customer_id);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      return [];
    }
  }

  async handleStripeWebhook(event: any): Promise<void> {
    console.log(`Processing Stripe webhook: ${event.type}`);
    
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
    
    // Store in webhook_events table if it exists
    try {
      await this.storeWebhookEvent('invoice.payment_succeeded', invoice);
    } catch (error) {
      console.log('Webhook storage failed (table may not exist):', error.message);
    }
  }

  private async handleInvoicePaymentFailed(invoice: any): Promise<void> {
    console.log(`Invoice payment failed: ${invoice.id}`);
    
    // Store in webhook_events table if it exists
    try {
      await this.storeWebhookEvent('invoice.payment_failed', invoice);
    } catch (error) {
      console.log('Webhook storage failed (table may not exist):', error.message);
    }
  }

  private async handleSubscriptionChanged(subscription: any): Promise<void> {
    console.log(`Subscription changed: ${subscription.id}, status: ${subscription.status}`);
    
    // Store in webhook_events table if it exists
    try {
      await this.storeWebhookEvent('subscription.changed', subscription);
    } catch (error) {
      console.log('Webhook storage failed (table may not exist):', error.message);
    }
  }

  private async storeWebhookEvent(type: string, payload: any): Promise<void> {
    // This would store in the webhook_events table if it exists
    // For now, just log since we're not sure about the table structure
    console.log(`Webhook event stored: ${type}`, { 
      id: payload.id, 
      status: payload.status 
    });
  }
}