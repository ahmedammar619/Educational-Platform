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

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly stripeService: StripeService,
  ) {}

  // Parent endpoints
  @Post('subscribe/:studentId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Parent)
  async createStudentSubscription(
    @Request() req,
    @Param('studentId') studentId: string
  ) {
    return this.paymentsService.createStudentSubscription(req.user.sub, studentId);
  }

  @Delete('subscribe/:studentId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Parent)
  async cancelStudentSubscription(
    @Request() req,
    @Param('studentId') studentId: string
  ) {
    return this.paymentsService.cancelStudentSubscription(req.user.sub, studentId);
  }

  @Post('reactivate/:studentId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Parent)
  async reactivateStudentSubscription(
    @Request() req,
    @Param('studentId') studentId: string
  ) {
    return this.paymentsService.reactivateStudentSubscription(req.user.sub, studentId);
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

  @Get('student/:studentId/subscription')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Parent, Role.Admin)
  async getStudentSubscription(@Param('studentId') studentId: string) {
    return this.paymentsService.getStudentSubscription(studentId);
  }

  @Get('student/:studentId/invoices')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Parent, Role.Admin)
  async getStudentInvoices(@Param('studentId') studentId: string) {
    return this.paymentsService.getStudentInvoices(studentId);
  }

  // Stripe configuration endpoint
  @Get('config')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Parent, Role.Admin)
  async getStripeConfig() {
    if (!this.stripeService.isConfigured()) {
      return { configured: false };
    }

    return {
      configured: true,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
      priceInfo: this.stripeService.getMonthlyPriceInfo(),
    };
  }

  // Admin endpoints
  @Get('admin/subscriptions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  async getAllSubscriptions() {
    return this.paymentsService.getAllSubscriptions();
  }

  @Get('admin/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  async getSubscriptionStats() {
    return this.paymentsService.getSubscriptionStats();
  }

  @Get('admin/invoices')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  async getAllInvoices() {
    // This will be implemented in the service
    return { message: 'Admin invoices endpoint - to be implemented' };
  }

  // Stripe webhook endpoint (no auth required)
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleStripeWebhook(
    @RawBody() payload: Buffer,
    @Headers('stripe-signature') signature: string
  ) {
    try {
      const event = await this.stripeService.constructWebhookEvent(payload, signature);
      await this.paymentsService.handleStripeWebhook(event);
      return { received: true };
    } catch (error) {
      console.error('Webhook error:', error);
      return { error: error.message };
    }
  }
}
