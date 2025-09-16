import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ZoomController } from './zoom.controller';
import { ZoomService } from './zoom.service';
import { ZoomApiService } from './services/zoom-api.service';
import { RecordingService } from './services/recording.service';
import { ZoomWebhookController } from './webhooks/zoom-webhook.controller';
import { ZoomWebhookService } from './webhooks/zoom-webhook.service';
import { RecordingTestController } from './controllers/recording-test.controller';
import { ZoomMeeting } from './entities/zoom-meeting.entity';
import { User } from '../users/entities/user.entity';
import { Attendance } from '../materials/entities/attendance.entity';
import { Course } from '../courses/entities/course.entity';
import { Class } from '../classes/entities/class.entity';
import { Parent } from '../parents/entities/parent.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { StorageModule } from '../storage/storage.module';
import { YouTubeModule } from '../youtube/youtube.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ZoomMeeting, User, Attendance, Course, Class, Parent]),
    forwardRef(() => NotificationsModule),
    StorageModule,
    YouTubeModule,
  ],
  controllers: [ZoomController, ZoomWebhookController, RecordingTestController],
  providers: [ZoomService, ZoomApiService, RecordingService, ZoomWebhookService],
  exports: [ZoomService, RecordingService],
})
export class ZoomModule {}
