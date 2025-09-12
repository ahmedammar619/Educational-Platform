import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnnouncementsController } from './announcements.controller';
import { AnnouncementsService } from './announcements.service';
import { AnnouncementPost } from './entities/announcement-post.entity';
import { AnnouncementPostAttachment } from './entities/announcement-post-attachment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AnnouncementPost, AnnouncementPostAttachment]),
  ],
  controllers: [AnnouncementsController],
  providers: [AnnouncementsService],
  exports: [AnnouncementsService],
})
export class AnnouncementsModule {}
