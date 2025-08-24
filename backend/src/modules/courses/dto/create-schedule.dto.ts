import { IsString, IsOptional, IsBoolean, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateScheduleDto {
  @ApiProperty({ description: 'Day of the week', example: 'Sunday' })
  @IsString()
  day: string;

  @ApiProperty({ description: 'Start time in 24-hour format', example: '16:00' })
  @IsString()
  startTime: string;

  @ApiProperty({ description: 'End time in 24-hour format', example: '18:00' })
  @IsString()
  endTime: string;

  @ApiProperty({ description: 'Whether schedule is active', required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ description: 'Sort order for display', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sortOrder?: number;

  @ApiProperty({ description: 'Additional notes', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateScheduleDto extends CreateScheduleDto {}

export class BulkCreateScheduleDto {
  @ApiProperty({ description: 'Array of schedule items' })
  schedules: CreateScheduleDto[];
}
