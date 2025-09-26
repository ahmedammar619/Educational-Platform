import { IsString, IsOptional, IsDateString, IsIn, MinLength, MaxLength, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAgoraMeetingDto {
  @ApiProperty({ description: 'Meeting title', example: 'Math Class Session' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({ description: 'Meeting description', example: 'Weekly math class session' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Meeting date (YYYY-MM-DD)', example: '2025-01-15' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ description: 'Meeting time (HH:MM)', example: '14:30' })
  @IsOptional()
  @IsString()
  time?: string;

  @ApiPropertyOptional({ description: 'Time period', enum: ['AM', 'PM'], example: 'PM' })
  @IsOptional()
  @IsIn(['AM', 'PM'])
  period?: string;

  @ApiProperty({ description: 'Course ID for the meeting', example: 'uuid-string' })
  @IsUUID()
  @IsOptional()
  courseId?: string;

  @ApiPropertyOptional({ description: 'Custom channel name (auto-generated if not provided)', example: 'math-class-2025-01-15' })
  @IsOptional()
  @IsString()
  channelName?: string;
}
