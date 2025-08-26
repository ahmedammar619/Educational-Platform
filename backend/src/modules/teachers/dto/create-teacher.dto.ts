import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, IsUUID } from 'class-validator';

export class CreateTeacherDto {
  @ApiProperty({
    description: 'Teacher ID (must match User ID)',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID()
  id: string;

  @ApiProperty({
    description: 'Array of subjects the teacher teaches',
    example: ['Quran', 'Arabic', 'Islamic Studies'],
    default: []
  })
  @IsArray()
  @IsString({ each: true })
  subjects: string[];
}
