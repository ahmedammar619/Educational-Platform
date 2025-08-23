import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';

// Entities
import { Course } from './entities/course.entity';
import { CourseSession } from './entities/course-session.entity';
import { CourseMaterial } from './entities/course-material.entity';
import { CourseFile } from './entities/course-file.entity';
import { CourseFolder } from './entities/course-folder.entity';
import { CourseEnrollment } from './entities/course-enrollment.entity';
import { SessionAttendance } from './entities/session-attendance.entity';
import { SessionMaterial } from './entities/session-material.entity';
import { MaterialAttachment } from './entities/material-attachment.entity';
import { CourseSchedule } from './entities/course-schedule.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Course,
      CourseSession,
      CourseMaterial,
      CourseFile,
      CourseFolder,
      CourseEnrollment,
      SessionAttendance,
      SessionMaterial,
      MaterialAttachment,
      CourseSchedule,
    ]),
  ],
  controllers: [CoursesController],
  providers: [CoursesService],
  exports: [CoursesService],
})
export class CoursesModule {}
