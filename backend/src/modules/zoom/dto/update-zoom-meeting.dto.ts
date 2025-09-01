import { PartialType } from '@nestjs/swagger';
import { CreateZoomMeetingDto } from './create-zoom-meeting.dto';

export class UpdateZoomMeetingDto extends PartialType(CreateZoomMeetingDto) {}
