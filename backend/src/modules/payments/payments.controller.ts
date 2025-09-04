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
import { Role } from '../../common/enums/role.enum';

@Controller('api/payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly stripeService: StripeService,
  ) {}

  // Public endpoint for Stripe configuration
  @Get('config')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PARENT, Role.ADMIN)
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
  @Roles(Role.PARENT)
  async createSubscription(@Request() req, @Param('studentId') studentId: string) {
    return this.paymentsService.createStudentSubscription(req.user.userId, studentId);
  }

  @Delete('subscribe/:studentId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PARENT)
  async cancelSubscription(@Request() req, @Param('studentId') studentId: string) {
    await this.paymentsService.cancelStudentSubscription(req.user.userId, studentId);
    return { message: 'Subscription cancelled successfully' };
  }

  @Get('subscriptions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PARENT)
  async getParentSubscriptions(@Request() req) {
    return this.paymentsService.getParentSubscriptions(req.user.userId);
  }

  @Get('invoices')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PARENT)
  async getParentInvoices(@Request() req) {
    return this.paymentsService.getParentInvoices(req.user.userId);
  }

  // Stripe Webhook (public endpoint)
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @RawBody() rawBody: Buffer,
    @Headers('stripe-signature') signature: string,
  ) {
    try {
      const event = this.stripeService.constructWebhookEvent(rawBody, signature);
      await this.paymentsService.handleStripeWebhook(event);
      return { received: true };
    } catch (error) {
      console.error('Webhook error:', error.message);
      throw error;
    }
  }
}