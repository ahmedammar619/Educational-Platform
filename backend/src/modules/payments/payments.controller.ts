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
  HttpStatus
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
}