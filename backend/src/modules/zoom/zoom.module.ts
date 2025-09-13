import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ZoomController } from './zoom.controller';
import { ZoomService } from './zoom.service';
import { ZoomMeeting } from './entities/zoom-meeting.entity';
import { User } from '../users/entities/user.entity';
import { Attendance } from '../materials/entities/attendance.entity';
import { Course } from '../courses/entities/course.entity';
import { Class } from '../classes/entities/class.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ZoomMeeting, User, Attendance, Course, Class]),
    forwardRef(() => NotificationsModule)
  ],
  controllers: [ZoomController],
  providers: [ZoomService],
  exports: [ZoomService],
})
export class ZoomModule {}
