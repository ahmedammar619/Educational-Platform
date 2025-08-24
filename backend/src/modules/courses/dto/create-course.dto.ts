import { IsString, IsNumber, IsDateString, IsOptional, IsArray, Min, Max, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCourseDto {
  @ApiProperty({ description: 'Course name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Course description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Teacher ID' })
  @IsUUID()
  teacherId: string;

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

  @ApiProperty({ description: 'Course schedule', required: false })
  @IsOptional()
  @IsArray()
  schedule?: {
    day: string;
    startTime: string;
    endTime: string;
  }[];
}
