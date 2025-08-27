import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { MaterialsService } from './materials.service';
import { MaterialsController } from './materials.controller';
import { FileManagementService } from './services/file-management.service';
import { Post } from './entities/post.entity';
import { PostAttachment } from './entities/post-attachment.entity';
import { Folder } from './entities/folder.entity';
import { File } from './entities/file.entity';
import { Assignment } from './entities/assignment.entity';
import { AssignmentSubmission } from './entities/assignment-submission.entity';
import { Attendance } from './entities/attendance.entity';
import { Course } from '../courses/entities/course.entity';
import { User } from '../users/entities/user.entity';

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
    ]),
    MulterModule.register({
      dest: './uploads/temp',
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
        files: 10, // Maximum 10 files per request
      },
    }),
  ],
  controllers: [MaterialsController],
  providers: [MaterialsService, FileManagementService],
  exports: [MaterialsService, FileManagementService],
})
export class MaterialsModule {}
