import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudentSubscription, SubscriptionStatus } from './entities/student-subscription.entity';
import { Payment, PaymentStatus, PaymentType } from './entities/payment.entity';
import { WebhookEvent } from './entities/webhook-event.entity';
import { StripeService } from '../../common/services/stripe.service';
import Stripe from 'stripe';

@Injectable()
export class WebhookHandlerService {
  private readonly logger = new Logger(WebhookHandlerService.name);

  constructor(
    @InjectRepository(StudentSubscription)
    private studentSubscriptionRepository: Repository<StudentSubscription>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(WebhookEvent)
    private webhookEventRepository: Repository<WebhookEvent>,
    private stripeService: StripeService,
  ) {}

  async handleStripeWebhook(event: Stripe.Event): Promise<void> {
    this.logger.log(`Processing Stripe webhook: ${event.type} (${event.id})`);

    // Store webhook event for audit trail
    await this.storeWebhookEvent(event);

    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
          break;

        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
          break;

        case 'payment_intent.payment_failed':
          await this.handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
          break;

        case 'invoice.paid':
        case 'invoice.payment_succeeded':
          await this.handleInvoicePaid(event.data.object as Stripe.Invoice);
          break;

        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
          break;

        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;

        default:
          this.logger.log(`Unhandled webhook event type: ${event.type}`);
      }

      this.logger.log(`Successfully processed webhook: ${event.type} (${event.id})`);
    } catch (error) {
      this.logger.error(`Error processing webhook ${event.type} (${event.id}):`, error);
      throw error;
    }
  }

  private async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<void> {
    this.logger.log(`Checkout session completed: ${session.id}`);

    const metadata = session.metadata;
    if (!metadata?.subscriptionId) {
      this.logger.warn('No subscription ID in session metadata');
      return;
    }

    const subscription = await this.studentSubscriptionRepository.findOne({
      where: { id: metadata.subscriptionId }
    });

    if (!subscription) {
      this.logger.error(`Subscription ${metadata.subscriptionId} not found`);
      return;
    }

    // Update subscription with Stripe data
    if (session.mode === 'subscription' && session.subscription) {
      const stripeSubscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription.id;
      subscription.stripeSubscriptionId = stripeSubscriptionId;

      // Retrieve full subscription object from Stripe to get accurate dates
      try {
        const stripeSubscription: any = await this.stripeService['stripe'].subscriptions.retrieve(stripeSubscriptionId);

        subscription.status = stripeSubscription.status as SubscriptionStatus;
        subscription.currentPeriodStart = new Date(stripeSubscription.current_period_start * 1000);
        subscription.currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000);

        this.logger.log(`Set subscription dates from Stripe: periodStart=${subscription.currentPeriodStart}, periodEnd=${subscription.currentPeriodEnd}`);
      } catch (error) {
        this.logger.error(`Failed to retrieve Stripe subscription ${stripeSubscriptionId}: ${error.message}`);
        // Fallback to basic dates if Stripe retrieve fails
        subscription.status = SubscriptionStatus.ACTIVE;
        subscription.currentPeriodStart = new Date();
        subscription.currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      }
    } else if (session.mode === 'payment') {
      // One-time payment
      subscription.isPaid = true;
      subscription.paidAt = new Date();
      subscription.status = SubscriptionStatus.ACTIVE;
    }

    await this.studentSubscriptionRepository.save(subscription);

    // Create payment record
    if (session.payment_intent) {
      await this.createPaymentFromSession(session, subscription);
    }
  }

  private async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    this.logger.log(`Payment intent succeeded: ${paymentIntent.id}`);

    const metadata = paymentIntent.metadata;
    if (!metadata?.subscriptionId) {
      return;
    }

    const subscription = await this.studentSubscriptionRepository.findOne({
      where: { id: metadata.subscriptionId }
    });

    if (!subscription) {
      return;
    }

    // Check if payment record already exists
    const existingPayment = await this.paymentRepository.findOne({
      where: { stripePaymentIntentId: paymentIntent.id }
    });

    if (existingPayment) {
      existingPayment.status = PaymentStatus.SUCCEEDED;
      existingPayment.paidAt = new Date();
      await this.paymentRepository.save(existingPayment);
    } else {
      // Create new payment record
      const payment = this.paymentRepository.create({
        userId: subscription.userId,
        studentId: subscription.studentId,
        studentName: subscription.studentName,
        planId: subscription.planId,
        planName: subscription.planName,
        studentSubscriptionId: subscription.id,
        stripePaymentIntentId: paymentIntent.id,
        paymentType: PaymentType.ONE_TIME,
        status: PaymentStatus.SUCCEEDED,
        amountPaid: paymentIntent.amount,
        currency: paymentIntent.currency,
        paidAt: new Date(),
      });

      await this.paymentRepository.save(payment);
    }

    // Mark subscription as paid for one-time payments
    if (!subscription.stripeSubscriptionId) {
      subscription.isPaid = true;
      subscription.paidAt = new Date();
      subscription.status = SubscriptionStatus.ACTIVE;
      await this.studentSubscriptionRepository.save(subscription);
    }
  }

  private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    this.logger.log(`Payment intent failed: ${paymentIntent.id}`);

    const payment = await this.paymentRepository.findOne({
      where: { stripePaymentIntentId: paymentIntent.id }
    });

    if (payment) {
      payment.status = PaymentStatus.FAILED;
      await this.paymentRepository.save(payment);
    }
  }

  private async handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
    this.logger.log(`Invoice paid: ${invoice.id}`);

    // Cast to any to access expandable fields
    const invoiceAny = invoice as any;
    const subscriptionId = typeof invoiceAny.subscription === 'string'
      ? invoiceAny.subscription
      : invoiceAny.subscription?.id;

    if (!subscriptionId) {
      return;
    }

    const subscription = await this.studentSubscriptionRepository.findOne({
      where: { stripeSubscriptionId: subscriptionId }
    });

    if (!subscription) {
      this.logger.warn(`Subscription not found for Stripe subscription ${subscriptionId}`);
      return;
    }

    const chargeId = typeof invoiceAny.charge === 'string'
      ? invoiceAny.charge
      : invoiceAny.charge?.id;

    // Create payment record
    const payment = this.paymentRepository.create({
      userId: subscription.userId,
      studentId: subscription.studentId,
      studentName: subscription.studentName,
      planId: subscription.planId,
      planName: subscription.planName,
      studentSubscriptionId: subscription.id,
      stripeInvoiceId: invoice.id,
      stripeChargeId: chargeId || null,
      paymentType: PaymentType.SUBSCRIPTION,
      status: PaymentStatus.SUCCEEDED,
      amountPaid: invoice.amount_paid,
      currency: invoice.currency,
      paidAt: invoice.status_transitions?.paid_at ? new Date(invoice.status_transitions.paid_at * 1000) : new Date(),
      receiptUrl: invoiceAny.hosted_invoice_url || null,
    });

    await this.paymentRepository.save(payment);

    // Update subscription status
    subscription.status = SubscriptionStatus.ACTIVE;
    await this.studentSubscriptionRepository.save(subscription);
  }

  private async handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    this.logger.log(`Invoice payment failed: ${invoice.id}`);

    // Cast to any to access expandable fields
    const invoiceAny = invoice as any;
    const subscriptionId = typeof invoiceAny.subscription === 'string'
      ? invoiceAny.subscription
      : invoiceAny.subscription?.id;

    if (!subscriptionId) {
      return;
    }

    const subscription = await this.studentSubscriptionRepository.findOne({
      where: { stripeSubscriptionId: subscriptionId }
    });

    if (subscription) {
      subscription.status = SubscriptionStatus.PAST_DUE;
      await this.studentSubscriptionRepository.save(subscription);
    }
  }

  private async handleSubscriptionUpdated(stripeSubscription: Stripe.Subscription): Promise<void> {
    this.logger.log(`Subscription updated: ${stripeSubscription.id}`);

    const subscription = await this.studentSubscriptionRepository.findOne({
      where: { stripeSubscriptionId: stripeSubscription.id }
    });

    if (!subscription) {
      this.logger.warn(`Subscription not found for Stripe subscription ${stripeSubscription.id}`);
      return;
    }

    // Cast to any to access TypeScript strict properties
    const stripeSub = stripeSubscription as any;

    // Update subscription details
    subscription.status = stripeSubscription.status as SubscriptionStatus;
    subscription.currentPeriodStart = new Date(stripeSub.current_period_start * 1000);
    subscription.currentPeriodEnd = new Date(stripeSub.current_period_end * 1000);

    if (stripeSub.cancel_at) {
      subscription.cancelAt = new Date(stripeSub.cancel_at * 1000);
    }

    if (stripeSub.canceled_at) {
      subscription.canceledAt = new Date(stripeSub.canceled_at * 1000);
    }

    await this.studentSubscriptionRepository.save(subscription);
  }

  private async handleSubscriptionDeleted(stripeSubscription: Stripe.Subscription): Promise<void> {
    this.logger.log(`Subscription deleted: ${stripeSubscription.id}`);

    const subscription = await this.studentSubscriptionRepository.findOne({
      where: { stripeSubscriptionId: stripeSubscription.id }
    });

    if (subscription) {
      subscription.status = SubscriptionStatus.CANCELED;
      subscription.canceledAt = new Date();
      await this.studentSubscriptionRepository.save(subscription);
    }
  }

  private async createPaymentFromSession(
    session: Stripe.Checkout.Session,
    subscription: StudentSubscription
  ): Promise<void> {
    const payment = this.paymentRepository.create({
      userId: subscription.userId,
      studentId: subscription.studentId,
      studentName: subscription.studentName,
      planId: subscription.planId,
      planName: subscription.planName,
      studentSubscriptionId: subscription.id,
      stripePaymentIntentId: session.payment_intent as string,
      paymentType: session.mode === 'subscription' ? PaymentType.SUBSCRIPTION : PaymentType.ONE_TIME,
      status: PaymentStatus.SUCCEEDED,
      amountPaid: session.amount_total,
      currency: session.currency,
      paidAt: new Date(),
    });

    await this.paymentRepository.save(payment);
  }

  private async storeWebhookEvent(event: Stripe.Event): Promise<void> {
    try {
      const existingEvent = await this.webhookEventRepository.findOne({
        where: { stripeEventId: event.id }
      });

      if (!existingEvent) {
        await this.webhookEventRepository.save({
          stripeEventId: event.id,
          type: event.type,
          payload: event,
        });
      }
    } catch (error) {
      // Ignore duplicate key errors (race condition when Stripe sends events quickly)
      if (error.code === '23505' || error.message?.includes('duplicate key')) {
        this.logger.log(`Webhook event ${event.id} already processed (duplicate), skipping`);
        return;
      }
      this.logger.error(`Failed to store webhook event: ${error.message}`);
    }
  }
}
