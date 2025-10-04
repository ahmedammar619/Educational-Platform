import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe
} from '@nestjs/common';
import { SubscriptionPlansService } from './subscription-plans.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto';
import { UpdateSubscriptionPlanDto } from './dto/update-subscription-plan.dto';
import { CreateStudentSubscriptionDto, BulkSubscribeDto } from './dto/create-student-subscription.dto';
import { CreateManualPaymentDto, UpdateStudentSubscriptionDto } from './dto/admin-payment.dto';
import { PlanType } from './entities/subscription-plan.entity';

@Controller('subscription-plans')
export class SubscriptionPlansController {
  constructor(
    private readonly subscriptionPlansService: SubscriptionPlansService
  ) {}

  // ============ ADMIN: Subscription Plan Management ============

  @Post('admin/plans')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  async createPlan(@Body() dto: CreateSubscriptionPlanDto) {
    return this.subscriptionPlansService.createPlan(dto);
  }

  @Get('admin/plans')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  async getAllPlans(@Query('includeInactive') includeInactive?: string) {
    return this.subscriptionPlansService.getAllPlans(includeInactive === 'true');
  }

  @Get('admin/plans/type/:type')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  async getPlansByType(@Param('type') type: PlanType) {
    return this.subscriptionPlansService.getPlansByType(type);
  }

  @Get('admin/plans/category/:category')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  async getPlansByCategory(@Param('category') category: string) {
    return this.subscriptionPlansService.getPlansByCategory(category);
  }

  @Get('admin/plans/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  async getPlanById(@Param('id', ParseUUIDPipe) id: string) {
    return this.subscriptionPlansService.getPlanById(id);
  }

  @Put('admin/plans/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  async updatePlan(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSubscriptionPlanDto
  ) {
    return this.subscriptionPlansService.updatePlan(id, dto);
  }

  @Delete('admin/plans/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  async deletePlan(@Param('id', ParseUUIDPipe) id: string) {
    await this.subscriptionPlansService.deletePlan(id);
    return { message: 'Plan deleted successfully' };
  }

  @Post('admin/plans/:id/toggle-status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  async togglePlanStatus(@Param('id', ParseUUIDPipe) id: string) {
    return this.subscriptionPlansService.togglePlanStatus(id);
  }

  // ============ ADMIN: Student Subscription Management ============

  @Get('admin/subscriptions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  async getAllStudentSubscriptions(@Query() filters: any) {
    return this.subscriptionPlansService.getAllStudentSubscriptions(filters);
  }

  @Get('admin/subscriptions/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  async getStudentSubscriptionById(@Param('id', ParseUUIDPipe) id: string) {
    return this.subscriptionPlansService.getStudentSubscriptionById(id);
  }

  @Put('admin/subscriptions/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  async updateStudentSubscription(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStudentSubscriptionDto
  ) {
    return this.subscriptionPlansService.updateStudentSubscription(id, dto);
  }

  @Post('admin/subscriptions/:id/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  async cancelStudentSubscription(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('cancelAtPeriodEnd') cancelAtPeriodEnd?: string
  ) {
    return this.subscriptionPlansService.cancelStudentSubscription(
      id,
      cancelAtPeriodEnd !== 'false'
    );
  }

  @Post('admin/payments/manual')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  async createManualPayment(
    @Request() req,
    @Body() dto: CreateManualPaymentDto
  ) {
    // Admin can record payment for any parent
    return this.subscriptionPlansService.createManualPayment(req.user.sub, dto);
  }

  // ============ ADMIN: Analytics & Reporting ============

  @Get('admin/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  async getPaymentStats() {
    return this.subscriptionPlansService.getPaymentStats();
  }

  // ============ PARENT: Browse and Subscribe ============

  @Get('available')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Parent, Role.Admin)
  async getAvailablePlans() {
    return this.subscriptionPlansService.getAvailablePlansForParent();
  }

  @Post('subscribe')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Parent)
  async subscribeStudent(
    @Request() req,
    @Body() dto: CreateStudentSubscriptionDto
  ) {
    return this.subscriptionPlansService.subscribeStudentToPlan(
      req.user.sub,
      dto.studentId,
      dto.planId,
      dto.notes
    );
  }

  @Post('bulk-subscribe')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Parent)
  async bulkSubscribeStudent(
    @Request() req,
    @Body() dto: BulkSubscribeDto
  ) {
    return this.subscriptionPlansService.bulkSubscribeStudent(req.user.sub, dto);
  }

  @Get('my-subscriptions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Parent)
  async getMySubscriptions(@Request() req) {
    return this.subscriptionPlansService.getParentSubscriptions(req.user.sub);
  }

  @Get('my-payments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Parent)
  async getMyPayments(@Request() req) {
    return this.subscriptionPlansService.getParentPayments(req.user.sub);
  }

  @Post('cancel-subscription/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Parent)
  async cancelSubscription(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string
  ) {
    return this.subscriptionPlansService.cancelParentSubscription(req.user.sub, id);
  }

  @Post('reactivate-subscription/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Parent)
  async reactivateSubscription(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string
  ) {
    return this.subscriptionPlansService.reactivateParentSubscription(req.user.sub, id);
  }

  @Get('admin/diagnose-prices')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  async diagnosePrices() {
    return this.subscriptionPlansService.diagnosePlanPrices();
  }

  @Post('admin/fix-one-time-prices')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  async fixOneTimePrices() {
    return this.subscriptionPlansService.fixOneTimePrices();
  }

  @Post('admin/migrate-add-on-plans')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  async migrateAddOnPlans() {
    return this.subscriptionPlansService.migrateAddOnPlans();
  }
}
