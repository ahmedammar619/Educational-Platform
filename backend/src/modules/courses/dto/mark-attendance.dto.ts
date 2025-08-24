import { IsEnum, IsOptional, IsString, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MarkAttendanceDto {
  @ApiProperty({ description: 'Student ID' })
  studentId: string;

  @ApiProperty({ description: 'Attendance status', enum: ['present', 'absent', 'late', 'not_marked'] })
  @IsEnum(['present', 'absent', 'late', 'not_marked'])
  status: 'present' | 'absent' | 'late' | 'not_marked';

  @ApiProperty({ description: 'Check-in time', required: false })
  @IsOptional()
  @IsDateString()
  checkInTime?: string;

  @ApiProperty({ description: 'Check-out time', required: false })
  @IsOptional()
  @IsDateString()
  checkOutTime?: string;

  @ApiProperty({ description: 'Notes about attendance', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class BulkMarkAttendanceDto {
  @ApiProperty({ description: 'Array of attendance records' })
  attendances: MarkAttendanceDto[];
}
