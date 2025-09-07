import { 
  Controller, 
  Get, 
  Post, 
  Delete,
  Body, 
  Param, 
  UseGuards, 
  Request,
  Headers,
  RawBody,
  HttpCode,
  HttpStatus,
  Query
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { StripeService } from '../../common/services/stripe.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Role } from '../../common/enums/role.enum';

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly stripeService: StripeService,
  ) {}

  // Public endpoint for Stripe configuration
  @Get('config')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Parent, Role.Admin)
  getStripeConfig() {
    const priceInfo = this.stripeService.getMonthlyPriceInfo();
    const isConfigured = this.stripeService.isConfigured();
    
    return {
      configured: isConfigured,
      publishableKey: isConfigured ? process.env.STRIPE_PUBLISHABLE_KEY : null,
      priceInfo: isConfigured ? priceInfo : null,
    };
  }

  // Check real-time subscription status
  @Get('status/:studentId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Parent, Role.Admin)
  async getSubscriptionStatus(@Request() req, @Param('studentId') studentId: string) {
    return this.paymentsService.getStudentSubscriptionStatus(req.user.sub, studentId);
  }

  // Parent Subscription Management
  @Post('subscribe/:studentId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Parent)
  async createSubscription(@Request() req, @Param('studentId') studentId: string) {
    return this.paymentsService.createStudentSubscription(req.user.sub, studentId);
  }

  @Delete('subscribe/:studentId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Parent)
  async cancelSubscription(@Request() req, @Param('studentId') studentId: string) {
    await this.paymentsService.cancelStudentSubscription(req.user.sub, studentId);
    return { message: 'Subscription cancelled successfully' };
  }

  @Post('reactivate/:studentId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Parent)
  async reactivateSubscription(@Request() req, @Param('studentId') studentId: string) {
    return this.paymentsService.reactivateStudentSubscription(req.user.sub, studentId);
  }

  // Temporary endpoint to fix webhook_events table
  @Public()
  @Post('fix-webhook-table')
  async fixWebhookTable() {
    return this.paymentsService.fixWebhookTable();
  }

  // Handle checkout session success (when user returns from Stripe)
  @Public()
  @Post('checkout-success')
  async handleCheckoutSuccess(@Request() req, @Body() body: { sessionId: string }) {
    return this.paymentsService.handleCheckoutSessionSuccess(body.sessionId);
  }

  @Get('subscriptions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Parent)
  async getParentSubscriptions(@Request() req) {
    return this.paymentsService.getParentSubscriptions(req.user.sub);
  }

  @Get('invoices')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Parent)
  async getParentInvoices(@Request() req) {
    return this.paymentsService.getParentInvoices(req.user.sub);
  }

  // Stripe Webhook (public endpoint)
  @Public()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @RawBody() rawBody: Buffer,
    @Body() body: any,
    @Headers('stripe-signature') signature: string,
  ) {
    try {
      // For development: Skip signature verification if no webhook secret is configured
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      
      let event;
      if (webhookSecret && rawBody) {
        // Production: Verify webhook signature
        event = this.stripeService.constructWebhookEvent(rawBody, signature);
      } else {
        // Development: Parse webhook without verification
        console.log('⚠️ Development mode: Skipping webhook signature verification');
        event = body || {};
      }
      
      await this.paymentsService.handleStripeWebhook(event);
      return { received: true };
    } catch (error) {
      console.error('Webhook error:', error.message);
      throw error;
    }
  }

  // Admin payment management endpoints
  @Get('admin/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  async getAdminPaymentStats() {
    return this.paymentsService.getAdminPaymentStats();
  }

  @Get('admin/subscriptions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  async getAdminSubscriptions(@Query() filters: any) {
    return this.paymentsService.getAdminSubscriptions(filters);
  }

  @Get('admin/invoices')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  async getAdminInvoices(@Query() filters: any) {
    return this.paymentsService.getAdminInvoices(filters);
  }

  @Get('admin/webhook-events')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  async getAdminWebhookEvents(@Query() filters: any) {
    return this.paymentsService.getAdminWebhookEvents(filters);
  }
}