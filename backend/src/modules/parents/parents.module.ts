import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParentsController } from './parents.controller';
import { ParentsService } from './parents.service';
import { Parent } from './entities/parent.entity';
import { User } from '../users/entities/user.entity';
import { Attendance } from '../sessions/entities/attendance.entity';
import { Submission } from '../assignments/entities/submission.entity';
import { Assignment } from '../assignments/entities/assignment.entity';
import { ClassSession } from '../sessions/entities/class-session.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Parent, User, Attendance, Submission, Assignment, ClassSession]), AuthModule],
  controllers: [ParentsController],
  providers: [ParentsService],
  exports: [ParentsService],
})
export class ParentsModule {}
