import { IsString, IsNumber, IsDateString, IsOptional, IsBoolean, IsEnum, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSessionDto {
  @ApiProperty({ description: 'Session title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Session description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Session date (YYYY-MM-DD)' })
  @IsDateString()
  scheduledDate: string;

  @ApiProperty({ description: 'Session start time (HH:MM)' })
  @IsString()
  startTime: string;

  @ApiProperty({ description: 'Session end time (HH:MM)' })
  @IsString()
  endTime: string;

  @ApiProperty({ description: 'Session type', enum: ['regular', 'custom', 'makeup', 'exam'], required: false })
  @IsOptional()
  @IsEnum(['regular', 'custom', 'makeup', 'exam'])
  type?: 'regular' | 'custom' | 'makeup' | 'exam';

  @ApiProperty({ description: 'Session notes', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ description: 'Maximum attendees', required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxAttendees?: number;

  @ApiProperty({ description: 'Whether session is mandatory', required: false })
  @IsOptional()
  @IsBoolean()
  isMandatory?: boolean;

  @ApiProperty({ description: 'Whether session will be recorded', required: false })
  @IsOptional()
  @IsBoolean()
  isRecorded?: boolean;
}
