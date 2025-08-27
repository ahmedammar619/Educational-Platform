import { IsUUID, IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

export class MarkAttendanceDto {
  @IsUUID()
  studentId: string;

  @IsDateString()
  date: string;

  @IsEnum(['present', 'absent', 'late'])
  status: 'present' | 'absent' | 'late';

  @IsOptional()
  @IsString()
  notes?: string;
}
