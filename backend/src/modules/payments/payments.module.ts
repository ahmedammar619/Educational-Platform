import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { WebhookEvent } from './entities/webhook-event.entity';
import { Invoice } from './entities/invoice.entity';
import { Subscription } from './entities/subscription.entity';
import { Student } from '../students/entities/student.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([WebhookEvent, Invoice, Subscription, Student, User]),
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
