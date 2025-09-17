import { Expose, Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AnnouncementMeetingCreatedByDto {
  @ApiProperty({ description: 'User ID' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'First name' })
  @Expose()
  firstName: string;

  @ApiProperty({ description: 'Last name' })
  @Expose()
  lastName: string;

  @ApiProperty({ description: 'Email address' })
  @Expose()
  email: string;

  @ApiProperty({ description: 'User role' })
  @Expose()
  role: string;
}

export class AnnouncementMeetingResponseDto {
  @ApiProperty({ description: 'Meeting ID' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Meeting title' })
  @Expose()
  title: string;

  @ApiPropertyOptional({ description: 'Meeting description' })
  @Expose()
  description?: string;

  @ApiProperty({ description: 'Zoom invitation link' })
  @Expose()
  invitationLink: string;

  @ApiPropertyOptional({ description: 'Zoom meeting ID' })
  @Expose()
  zoomMeetingId?: string;

  @ApiPropertyOptional({ description: 'Zoom password' })
  @Expose()
  zoomPassword?: string;

  @ApiPropertyOptional({ description: 'Zoom start URL for host' })
  @Expose()
  zoomStartUrl?: string;

  @ApiPropertyOptional({ description: 'Meeting date' })
  @Expose()
  date?: string;

  @ApiPropertyOptional({ description: 'Meeting time' })
  @Expose()
  time?: string;

  @ApiProperty({ description: 'Time period (AM/PM)' })
  @Expose()
  period: string;

  @ApiProperty({ description: 'Number of participants who joined' })
  @Expose()
  joinCount: number;

  @ApiProperty({ description: 'Meeting status' })
  @Expose()
  status: string;

  @ApiProperty({ description: 'Recording status' })
  @Expose()
  recordingStatus: string;

  @ApiPropertyOptional({ description: 'Recording URL' })
  @Expose()
  recordingUrl?: string;

  @ApiPropertyOptional({ description: 'YouTube video ID' })
  @Expose()
  youtubeVideoId?: string;

  @ApiPropertyOptional({ description: 'YouTube URL' })
  @Expose()
  youtubeUrl?: string;

  @ApiPropertyOptional({ description: 'Recording completed timestamp' })
  @Expose()
  recordingCompletedAt?: Date;

  @ApiPropertyOptional({ description: 'R2 recording key' })
  @Expose()
  r2RecordingKey?: string;

  @ApiPropertyOptional({ description: 'R2 recording URL' })
  @Expose()
  r2RecordingUrl?: string;

  @ApiProperty({ description: 'Created by user ID' })
  @Expose()
  createdById: string;

  @ApiProperty({ description: 'Meeting creator details', type: AnnouncementMeetingCreatedByDto })
  @Expose()
  @Type(() => AnnouncementMeetingCreatedByDto)
  createdBy: AnnouncementMeetingCreatedByDto;

  @ApiProperty({ description: 'Creation timestamp' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @Expose()
  updatedAt: Date;
}
