import { IsDateString, IsString, IsArray, ValidateNested, IsEnum, IsUUID, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class StudentAttendanceDto {
  @IsUUID()
  id: string;

  @IsString()
  name: string;

  @IsEnum(['present', 'absent', 'late'])
  status: 'present' | 'absent' | 'late';
}

export class BulkAttendanceDto {
  @IsDateString()
  date: string;

  @IsString()
  day: string; // e.g., 'Monday', 'Wednesday', 'Friday'

  @IsString()
  time: string; // e.g., '09:00-11:00', '14:00-16:00', '10:00-12:00'

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StudentAttendanceDto)
  students: StudentAttendanceDto[];
}
