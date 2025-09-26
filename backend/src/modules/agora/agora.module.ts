import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgoraController } from './agora.controller';
import { AgoraService } from './agora.service';
import { AgoraTokenService } from './services/agora-token.service';
import { AgoraRecordingService } from './services/agora-recording.service';
import { AgoraMeeting } from './entities/agora-meeting.entity';
import { User } from '../users/entities/user.entity';
import { Attendance } from '../materials/entities/attendance.entity';
import { Course } from '../courses/entities/course.entity';
import { Class } from '../classes/entities/class.entity';
import { Parent } from '../parents/entities/parent.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AgoraMeeting, User, Attendance, Course, Class, Parent]),
    forwardRef(() => NotificationsModule),
  ],
  controllers: [AgoraController],
  providers: [AgoraService, AgoraTokenService, AgoraRecordingService],
  exports: [AgoraService, AgoraTokenService, AgoraRecordingService],
})
export class AgoraModule {}
