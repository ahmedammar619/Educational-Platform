import { IsString, IsNumber, IsDateString, IsOptional, IsBoolean, IsArray, IsEnum, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCourseDto {
  @ApiProperty({ description: 'Course name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Course description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Course price in USD' })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ description: 'Number of sessions in the course' })
  @IsNumber()
  @Min(1)
  numberOfSessions: number;

  @ApiProperty({ description: 'Duration of each session in minutes' })
  @IsNumber()
  @Min(15)
  @Max(480) // 8 hours max
  sessionDuration: number;

  @ApiProperty({ description: 'Course start date (YYYY-MM-DD)' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'Course end date (YYYY-MM-DD)' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ description: 'Maximum number of students', required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxStudents?: number;

  @ApiProperty({ description: 'Course category', required: false })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ description: 'Course level', enum: ['beginner', 'intermediate', 'advanced'], required: false })
  @IsOptional()
  @IsEnum(['beginner', 'intermediate', 'advanced'])
  level?: 'beginner' | 'intermediate' | 'advanced';

  @ApiProperty({ description: 'Course location (room or Zoom link)', required: false })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ description: 'Course requirements', required: false })
  @IsOptional()
  @IsString()
  requirements?: string;

  @ApiProperty({ description: 'Learning outcomes', required: false })
  @IsOptional()
  @IsString()
  learningOutcomes?: string;

  @ApiProperty({ description: 'Course schedule', required: false })
  @IsOptional()
  @IsArray()
  schedule?: {
    day: string;
    startTime: string;
    endTime: string;
  }[];

  @ApiProperty({ description: 'Whether course is published', required: false })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
