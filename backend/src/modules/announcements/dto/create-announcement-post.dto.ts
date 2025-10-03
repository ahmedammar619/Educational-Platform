import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateAnnouncementPostDto {
  @ApiProperty({ description: 'Post subject', example: 'Important Announcement' })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({ description: 'Post description/content', example: 'This is an important announcement for all users.' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'Timezone where the post was created', example: 'America/Chicago', required: false })
  @IsString()
  @IsOptional()
  creatorTimezone?: string;
}
