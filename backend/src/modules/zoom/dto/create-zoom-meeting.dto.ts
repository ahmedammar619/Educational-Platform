import { IsString, IsOptional, IsUrl, IsDateString, IsIn, MinLength, MaxLength, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateZoomMeetingDto {
  @ApiProperty({ description: 'Meeting title', example: 'Math Class Session' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({ description: 'Meeting description', example: 'Weekly math class session' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Zoom invitation link (auto-generated if not provided)', example: 'https://zoom.us/j/123456789' })
  @IsOptional()
  @IsUrl()
  invitationLink?: string;

  @ApiPropertyOptional({ description: 'Meeting date (YYYY-MM-DD)', example: '2025-01-15' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ description: 'Meeting time (HH:MM)', example: '14:30' })
  @IsOptional()
  @IsString()
  time?: string;

  @ApiPropertyOptional({ description: 'Time period', enum: ['AM', 'PM'], example: 'PM' })
  @IsOptional()
  @IsIn(['AM', 'PM'])
  period?: string;

  @ApiProperty({ description: 'Course ID for the meeting', example: 'uuid-string' })
  @IsUUID()
  @IsOptional()
  courseId?: string;

  @ApiPropertyOptional({ description: 'Timezone where the meeting was created', example: 'America/Chicago' })
  @IsOptional()
  @IsString()
  creatorTimezone?: string;
}
