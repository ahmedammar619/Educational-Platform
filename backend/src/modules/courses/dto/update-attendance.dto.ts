import { IsString, IsOptional, IsBoolean, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateAttendanceDto {
  @ApiProperty({ description: 'Attendance status', required: false })
  @IsOptional()
  @IsString()
  status?: 'present' | 'absent' | 'late' | 'not_marked';

  @ApiProperty({ description: 'Check-in time', required: false })
  @IsOptional()
  @IsDateString()
  checkInTime?: string;

  @ApiProperty({ description: 'Check-out time', required: false })
  @IsOptional()
  @IsDateString()
  checkOutTime?: string;

  @ApiProperty({ description: 'Teacher notes about attendance', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ description: 'Whether absence is excused', required: false })
  @IsOptional()
  @IsBoolean()
  isExcused?: boolean;

  @ApiProperty({ description: 'Reason for excuse', required: false })
  @IsOptional()
  @IsString()
  excuseReason?: string;
}
