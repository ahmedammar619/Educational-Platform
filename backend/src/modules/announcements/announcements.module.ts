import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnnouncementsController } from './announcements.controller';
import { AnnouncementsService } from './announcements.service';
import { AnnouncementMeetingsService } from './services/announcement-meetings.service';
import { AnnouncementPost } from './entities/announcement-post.entity';
import { AnnouncementPostAttachment } from './entities/announcement-post-attachment.entity';
import { AnnouncementMeeting } from './entities/announcement-meeting.entity';
import { User } from '../users/entities/user.entity';
import { R2FileService } from '../../common/services/r2-file.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { ZoomModule } from '../zoom/zoom.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AnnouncementPost, 
      AnnouncementPostAttachment, 
      AnnouncementMeeting,
      User
    ]),
    forwardRef(() => NotificationsModule),
    forwardRef(() => ZoomModule),
  ],
  controllers: [AnnouncementsController],
  providers: [AnnouncementsService, AnnouncementMeetingsService, R2FileService],
  exports: [AnnouncementsService, AnnouncementMeetingsService],
})
export class AnnouncementsModule {}
