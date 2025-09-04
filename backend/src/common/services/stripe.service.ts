import { Injectable, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private readonly stripe: Stripe;
  private readonly logger = new Logger(StripeService.name);
  private readonly monthlyProductId: string;
  private readonly monthlyPriceId: string;

  constructor(private readonly configService: ConfigService) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    
    if (!secretKey) {
      this.logger.warn('⚠️ Stripe secret key not configured. Payment features will be disabled.');
      return;
    }

    this.stripe = new Stripe(secretKey, {
      apiVersion: '2025-08-27.basil',
    });

    this.monthlyProductId = this.configService.get<string>('STRIPE_MONTHLY_PRODUCT_ID');
    this.monthlyPriceId = this.configService.get<string>('STRIPE_MONTHLY_PRICE_ID');

    this.logger.log('✅ Stripe service initialized');
  }

  private validateStripeConfig(): void {
    if (!this.stripe) {
      throw new InternalServerErrorException('Stripe service is not configured');
    }
  }

  async createCustomer(email: string, name: string, metadata?: Record<string, string>): Promise<Stripe.Customer> {
    this.validateStripeConfig();

    try {
      const customer = await this.stripe.customers.create({
        email,
        name,
        metadata: metadata || {},
      });

      this.logger.log(`✅ Created Stripe customer: ${customer.id} for ${email}`);
      return customer;
    } catch (error) {
      this.logger.error(`❌ Failed to create customer: ${error.message}`);
      throw new BadRequestException(`Failed to create customer: ${error.message}`);
    }
  }

  async createSubscription(
    customerId: string,
    priceId?: string,
    metadata?: Record<string, string>
  ): Promise<Stripe.Subscription> {
    this.validateStripeConfig();

    try {
      const subscription = await this.stripe.subscriptions.create({
        customer: customerId,
        items: [
          {
            price: priceId || this.monthlyPriceId,
          },
        ],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
        metadata: metadata || {},
      });

      this.logger.log(`✅ Created subscription: ${subscription.id} for customer: ${customerId}`);
      return subscription;
    } catch (error) {
      this.logger.error(`❌ Failed to create subscription: ${error.message}`);
      throw new BadRequestException(`Failed to create subscription: ${error.message}`);
    }
  }

  async cancelSubscription(subscriptionId: string, cancelAtPeriodEnd = true): Promise<Stripe.Subscription> {
    this.validateStripeConfig();

    try {
      const subscription = await this.stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: cancelAtPeriodEnd,
      });

      this.logger.log(`✅ ${cancelAtPeriodEnd ? 'Scheduled cancellation' : 'Cancelled'} subscription: ${subscriptionId}`);
      return subscription;
    } catch (error) {
      this.logger.error(`❌ Failed to cancel subscription: ${error.message}`);
      throw new BadRequestException(`Failed to cancel subscription: ${error.message}`);
    }
  }

  async reactivateSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    this.validateStripeConfig();

    try {
      const subscription = await this.stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: false,
      });

      this.logger.log(`✅ Reactivated subscription: ${subscriptionId}`);
      return subscription;
    } catch (error) {
      this.logger.error(`❌ Failed to reactivate subscription: ${error.message}`);
      throw new BadRequestException(`Failed to reactivate subscription: ${error.message}`);
    }
  }

  async getCustomer(customerId: string): Promise<Stripe.Customer> {
    this.validateStripeConfig();

    try {
      const customer = await this.stripe.customers.retrieve(customerId);
      return customer as Stripe.Customer;
    } catch (error) {
      this.logger.error(`❌ Failed to get customer: ${error.message}`);
      throw new BadRequestException(`Failed to get customer: ${error.message}`);
    }
  }

  async getCustomerSubscriptions(customerId: string): Promise<Stripe.Subscription[]> {
    this.validateStripeConfig();

    try {
      const subscriptions = await this.stripe.subscriptions.list({
        customer: customerId,
        limit: 100,
      });
      return subscriptions.data;
    } catch (error) {
      this.logger.error(`❌ Failed to get customer subscriptions: ${error.message}`);
      throw new BadRequestException(`Failed to get customer subscriptions: ${error.message}`);
    }
  }

  async getCustomerInvoices(customerId: string): Promise<Stripe.Invoice[]> {
    this.validateStripeConfig();

    try {
      const invoices = await this.stripe.invoices.list({
        customer: customerId,
        limit: 100,
      });
      return invoices.data;
    } catch (error) {
      this.logger.error(`❌ Failed to get customer invoices: ${error.message}`);
      throw new BadRequestException(`Failed to get customer invoices: ${error.message}`);
    }
  }

  async getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    this.validateStripeConfig();

    try {
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId, {
        expand: ['latest_invoice', 'customer', 'default_payment_method'],
      });

      return subscription;
    } catch (error) {
      this.logger.error(`❌ Failed to retrieve subscription: ${error.message}`);
      throw new BadRequestException(`Failed to retrieve subscription: ${error.message}`);
    }
  }

  async getCustomer(customerId: string): Promise<Stripe.Customer> {
    this.validateStripeConfig();

    try {
      const customer = await this.stripe.customers.retrieve(customerId) as Stripe.Customer;
      return customer;
    } catch (error) {
      this.logger.error(`❌ Failed to retrieve customer: ${error.message}`);
      throw new BadRequestException(`Failed to retrieve customer: ${error.message}`);
    }
  }

  async getInvoices(customerId: string, limit = 10): Promise<Stripe.Invoice[]> {
    this.validateStripeConfig();

    try {
      const invoices = await this.stripe.invoices.list({
        customer: customerId,
        limit,
        expand: ['data.subscription'],
      });

      return invoices.data;
    } catch (error) {
      this.logger.error(`❌ Failed to retrieve invoices: ${error.message}`);
      throw new BadRequestException(`Failed to retrieve invoices: ${error.message}`);
    }
  }

  async createPaymentIntent(amount: number, currency = 'usd', customerId?: string): Promise<Stripe.PaymentIntent> {
    this.validateStripeConfig();

    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount,
        currency,
        customer: customerId,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      this.logger.log(`✅ Created payment intent: ${paymentIntent.id} for amount: ${amount}`);
      return paymentIntent;
    } catch (error) {
      this.logger.error(`❌ Failed to create payment intent: ${error.message}`);
      throw new BadRequestException(`Failed to create payment intent: ${error.message}`);
    }
  }

  async getPaymentMethods(customerId: string): Promise<Stripe.PaymentMethod[]> {
    this.validateStripeConfig();

    try {
      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
      });

      return paymentMethods.data;
    } catch (error) {
      this.logger.error(`❌ Failed to retrieve payment methods: ${error.message}`);
      throw new BadRequestException(`Failed to retrieve payment methods: ${error.message}`);
    }
  }

  async constructWebhookEvent(payload: string | Buffer, signature: string): Promise<Stripe.Event> {
    this.validateStripeConfig();

    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      throw new InternalServerErrorException('Webhook secret not configured');
    }

    try {
      const event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
      return event;
    } catch (error) {
      this.logger.error(`❌ Webhook signature verification failed: ${error.message}`);
      throw new BadRequestException(`Webhook signature verification failed: ${error.message}`);
    }
  }

  // Helper method to get price information
  getMonthlyPriceInfo() {
    return {
      productId: this.monthlyProductId,
      priceId: this.monthlyPriceId,
    };
  }

  // Check if Stripe is configured
  isConfigured(): boolean {
    return !!this.stripe;
  }
}
