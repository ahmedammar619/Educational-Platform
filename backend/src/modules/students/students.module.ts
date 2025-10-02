import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';
import { Student } from './entities/student.entity';
import { User } from '../users/entities/user.entity';
import { Parent } from '../parents/entities/parent.entity';
import { Class } from '../classes/entities/class.entity';
import { Course } from '../courses/entities/course.entity';
import { AssignmentSubmission } from '../materials/entities/assignment-submission.entity';
import { Attendance } from '../materials/entities/attendance.entity';
import { Subscription } from '../payments/entities/subscription.entity';
import { Invoice } from '../payments/entities/invoice.entity';
import { AppConfig } from '../admin/entities/app-config.entity';
import { ConfigService } from '../admin/config.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Student, 
      User, 
      Parent, 
      Class, 
      Course, 
      AssignmentSubmission,
      Attendance,
      Subscription,
      Invoice,
      AppConfig,
    ]),
    NotificationsModule
  ],
  controllers: [StudentsController],
  providers: [StudentsService, ConfigService],
  exports: [StudentsService],
})
export class StudentsModule {}
