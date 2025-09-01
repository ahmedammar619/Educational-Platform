import { IsString, IsOptional, IsUrl, IsDateString, IsIn, MinLength, MaxLength } from 'class-validator';
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

  @ApiProperty({ description: 'Zoom invitation link', example: 'https://zoom.us/j/123456789' })
  @IsUrl()
  invitationLink: string;

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
}
