import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';
import { Student } from './entities/student.entity';
import { User } from '../users/entities/user.entity';
import { Parent } from '../parents/entities/parent.entity';
import { Class } from '../classes/entities/class.entity';
import { Course } from '../courses/entities/course.entity';
import { AppConfig } from '../admin/entities/app-config.entity';
import { ConfigService } from '../admin/config.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Student, User, Parent, Class, Course, AppConfig])
  ],
  controllers: [StudentsController],
  providers: [StudentsService, ConfigService],
  exports: [StudentsService],
})
export class StudentsModule {}
