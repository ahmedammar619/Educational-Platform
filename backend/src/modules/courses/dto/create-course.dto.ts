import { IsString, IsNotEmpty, Length, IsUUID, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateSessionDto } from './create-session.dto';

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
  @ValidateNested({ each: true })
  @Type(() => CreateSessionDto)
  sessions: CreateSessionDto[];
}
