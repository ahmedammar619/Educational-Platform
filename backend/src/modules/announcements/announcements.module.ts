import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnnouncementsController } from './announcements.controller';
import { AnnouncementsService } from './announcements.service';
import { AnnouncementPost } from './entities/announcement-post.entity';
import { AnnouncementPostAttachment } from './entities/announcement-post-attachment.entity';
import { R2FileService } from '../../common/services/r2-file.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([AnnouncementPost, AnnouncementPostAttachment]),
  ],
  controllers: [AnnouncementsController],
  providers: [AnnouncementsService, R2FileService],
  exports: [AnnouncementsService],
})
export class AnnouncementsModule {}
