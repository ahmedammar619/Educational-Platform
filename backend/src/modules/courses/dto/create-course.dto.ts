import { IsString, IsNotEmpty, Length, IsUUID, IsArray, IsOptional } from 'class-validator';

export class CreateCourseDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  name: string;

  @IsUUID()
  teacherId: string;

  @IsUUID()
  classId: string;

  @IsArray()
  @IsOptional()
  sessions?: any[];
}
