import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { SubscriptionPlansService } from './subscription-plans.service';
import { SubscriptionPlansController } from './subscription-plans.controller';
import { WebhookHandlerService } from './webhook-handler.service';
import { User } from '../users/entities/user.entity';
import { Student } from '../students/entities/student.entity';
import { WebhookEvent } from './entities/webhook-event.entity';
import { Subscription } from './entities/subscription.entity';
import { Invoice } from './entities/invoice.entity';
import { SubscriptionPlan } from './entities/subscription-plan.entity';
import { StudentSubscription } from './entities/student-subscription.entity';
import { Payment } from './entities/payment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Student,
      WebhookEvent,
      Subscription,
      Invoice,
      SubscriptionPlan,
      StudentSubscription,
      Payment
    ]),
  ],
  controllers: [PaymentsController, SubscriptionPlansController],
  providers: [PaymentsService, SubscriptionPlansService, WebhookHandlerService],
  exports: [PaymentsService, SubscriptionPlansService, WebhookHandlerService],
})
export class PaymentsModule {}
