import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoursesService } from './courses.service';
import { CoursesController } from './courses.controller';
import { Course } from './entities/course.entity';
import { Class } from '../classes/entities/class.entity';
import { User } from '../users/entities/user.entity';
import { Teacher } from '../teachers/entities/teacher.entity';
import { Student } from '../students/entities/student.entity';
import { NotificationsModule } from '../notifications/notifications.module';
// Import materials entities for cascading deletion
import { Post } from '../materials/entities/post.entity';
import { Folder } from '../materials/entities/folder.entity';
import { File } from '../materials/entities/file.entity';
import { Assignment } from '../materials/entities/assignment.entity';
import { Attendance } from '../materials/entities/attendance.entity';
import { AssignmentSubmission } from '../materials/entities/assignment-submission.entity';
import { PostAttachment } from '../materials/entities/post-attachment.entity';
import { ZoomMeeting } from '../zoom/entities/zoom-meeting.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Course, 
      Class, 
      User, 
      Teacher,
      Student,
      // Materials entities for cascading deletion
      Post,
      Folder,
      File,
      Assignment,
      Attendance,
      AssignmentSubmission,
      PostAttachment,
      ZoomMeeting
    ]),
    forwardRef(() => NotificationsModule),
  ],
  controllers: [CoursesController],
  providers: [CoursesService],
  exports: [CoursesService],
})
export class CoursesModule {}
