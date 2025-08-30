import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WebhookEvent } from './entities/webhook-event.entity';
import { Invoice } from './entities/invoice.entity';
import { Subscription } from './entities/subscription.entity';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(WebhookEvent)
    private webhookEventRepository: Repository<WebhookEvent>,
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
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
}
