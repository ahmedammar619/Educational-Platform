import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class UpdateAnnouncementPostDto {
  @ApiProperty({ description: 'Post subject', example: 'Updated Announcement', required: false })
  @IsString()
  @IsOptional()
  subject?: string;

  @ApiProperty({ description: 'Post description/content', example: 'This is an updated announcement.', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}
