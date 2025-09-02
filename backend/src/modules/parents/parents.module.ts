import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParentsController } from './parents.controller';
import { ParentsService } from './parents.service';
import { Parent } from './entities/parent.entity';
import { User } from '../users/entities/user.entity';
import { StudentsModule } from '../students/students.module';
import { EnrollmentsModule } from '../enrollments/enrollments.module';

@Module({
  imports: [TypeOrmModule.forFeature([Parent, User]), StudentsModule, EnrollmentsModule],
  controllers: [ParentsController],
  providers: [ParentsService],
  exports: [ParentsService],
})
export class ParentsModule {}
