import { IsString, IsNotEmpty, Length, IsUUID, IsArray, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCourseDto {
  @ApiProperty({
    description: 'Name of the course',
    example: 'Mathematics 101',
    minLength: 1,
    maxLength: 255
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  name: string;

  @ApiProperty({
    description: 'ID of the teacher assigned to this course',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
    required: false
  })
  @IsUUID()
  @IsOptional()
  teacherId?: string;

  @ApiProperty({
    description: 'ID of the class this course belongs to',
    example: '123e4567-e89b-12d3-a456-426614174001',
    format: 'uuid'
  })
  @IsUUID()
  classId: string;

  @ApiProperty({
    description: 'Array of session objects defining course schedule',
    example: [
      { day: 'Monday', startTime: '09:00', endTime: '10:00' },
      { day: 'Wednesday', startTime: '09:00', endTime: '10:00' }
    ],
    type: 'array',
    required: false
  })
  @IsArray()
  @IsOptional()
  sessions?: any[];
}
