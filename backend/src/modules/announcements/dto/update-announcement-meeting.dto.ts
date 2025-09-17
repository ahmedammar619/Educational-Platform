import { PartialType } from '@nestjs/swagger';
import { CreateAnnouncementMeetingDto } from './create-announcement-meeting.dto';

export class UpdateAnnouncementMeetingDto extends PartialType(CreateAnnouncementMeetingDto) {}
