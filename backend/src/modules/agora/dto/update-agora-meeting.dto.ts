import { PartialType } from '@nestjs/swagger';
import { CreateAgoraMeetingDto } from './create-agora-meeting.dto';

export class UpdateAgoraMeetingDto extends PartialType(CreateAgoraMeetingDto) {}
