import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { MaterialsService } from './materials.service';
import { MaterialsController } from './materials.controller';
import { NotificationsModule } from '../notifications/notifications.module';


import { Post } from './entities/post.entity';
import { PostAttachment } from './entities/post-attachment.entity';
import { Folder } from './entities/folder.entity';
import { File } from './entities/file.entity';
import { Assignment } from './entities/assignment.entity';
import { AssignmentSubmission } from './entities/assignment-submission.entity';
import { Attendance } from './entities/attendance.entity';
import { Course } from '../courses/entities/course.entity';
import { User } from '../users/entities/user.entity';
import { ZoomMeeting } from '../zoom/entities/zoom-meeting.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Post,
      PostAttachment,
      Folder,
      File,
      Assignment,
      AssignmentSubmission,
      Attendance,
      Course,
      User,
      ZoomMeeting,
    ]),
    MulterModule.register({
      storage: memoryStorage(),
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
        files: 10, // Maximum 10 files per request
      },
    }),
    forwardRef(() => NotificationsModule),
  ],
  controllers: [MaterialsController],
  providers: [MaterialsService],
  exports: [MaterialsService],
})
export class MaterialsModule {}
