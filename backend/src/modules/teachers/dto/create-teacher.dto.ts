import { IsString, IsArray, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTeacherDto {
  @ApiProperty({
    description: 'User ID for the teacher',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID()
  id: string;

  @ApiProperty({
    description: 'Array of courses the teacher teaches',
    example: ['Mathematics', 'Physics'],
    type: [String]
  })
  @IsArray()
  @IsString({ each: true })
  courses: string[];
}
