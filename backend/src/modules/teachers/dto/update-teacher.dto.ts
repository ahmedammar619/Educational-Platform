import { IsArray, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTeacherDto {
  @ApiProperty({
    description: 'Array of courses the teacher teaches',
    example: ['Mathematics', 'Physics'],
    type: [String],
    required: false
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  courses?: string[];
}
