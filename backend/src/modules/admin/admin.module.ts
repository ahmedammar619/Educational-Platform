import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { ConfigService } from './config.service';
import { User } from '../users/entities/user.entity';
import { AppConfig } from './entities/app-config.entity';
import { StudentSubscription } from '../payments/entities/student-subscription.entity';
import { SubscriptionPlan } from '../payments/entities/subscription-plan.entity';
import { Course } from '../courses/entities/course.entity';
import { Student } from '../students/entities/student.entity';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      AppConfig,
      StudentSubscription,
      SubscriptionPlan,
      Course,
      Student
    ]),
    AuthModule,
    forwardRef(() => NotificationsModule)
  ],
  controllers: [AdminController],
  providers: [AdminService, ConfigService],
  exports: [AdminService, ConfigService],
})
export class AdminModule {}