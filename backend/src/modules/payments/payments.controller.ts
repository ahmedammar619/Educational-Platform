import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('invoices')
  @Roles(Role.Admin, Role.Teacher, Role.Student, Role.Parent)
  async getUserInvoices(@Request() req) {
    return this.paymentsService.findInvoicesByUserId(req.user.sub);
  }

  @Get('subscription')
  @Roles(Role.Admin, Role.Teacher, Role.Student, Role.Parent)
  async getUserSubscription(@Request() req) {
    return this.paymentsService.findSubscriptionByUserId(req.user.sub);
  }

  @Post('webhook')
  async handleStripeWebhook(@Body() payload: any) {
    // This endpoint will handle Stripe webhooks
    // You'll need to implement proper webhook signature verification
    const { id: stripeEventId, type, data } = payload;

    // Check if we've already processed this event
    const existingEvent = await this.paymentsService.findWebhookEventByStripeId(stripeEventId);
    if (existingEvent) {
      return { received: true, message: 'Event already processed' };
    }

    // Store the webhook event
    await this.paymentsService.createWebhookEvent({
      stripeEventId,
      type,
      payload,
    });

    // Handle different event types
    switch (type) {
      case 'invoice.payment_succeeded':
        // Handle successful payment
        break;
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        // Handle subscription changes
        break;
      default:
        console.log(`Unhandled event type: ${type}`);
    }

    return { received: true };
  }

  // Admin-only endpoints
  @Get('admin/invoices')
  @Roles(Role.Admin)
  async getAllInvoices() {
    // Implementation for admin to view all invoices
    return { message: 'Admin invoices endpoint - implement as needed' };
  }

  @Get('admin/subscriptions')
  @Roles(Role.Admin)
  async getAllSubscriptions() {
    // Implementation for admin to view all subscriptions
    return { message: 'Admin subscriptions endpoint - implement as needed' };
  }
}
