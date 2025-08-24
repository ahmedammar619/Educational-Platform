import { IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CreateScheduleDto } from './create-schedule.dto';

export class BulkCreateScheduleDto {
  @ApiProperty({ description: 'Array of schedules to create', type: [CreateScheduleDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateScheduleDto)
  schedules: CreateScheduleDto[];
}
