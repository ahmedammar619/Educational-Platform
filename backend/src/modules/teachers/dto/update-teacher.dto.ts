import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class UpdateTeacherDto {
  @ApiProperty({
    description: 'Array of subjects the teacher teaches',
    example: ['Quran', 'Arabic', 'Islamic Studies'],
    required: false
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  subjects?: string[];
}
