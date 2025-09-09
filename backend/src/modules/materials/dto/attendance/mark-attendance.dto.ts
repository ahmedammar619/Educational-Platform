import { IsUUID, IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

export class MarkAttendanceDto {
  @IsUUID()
  studentId: string;

  @IsDateString()
  date: string;

  @IsEnum(['present', 'absent'])
  status: 'present' | 'absent';

  @IsOptional()
  @IsString()
  notes?: string;
}
