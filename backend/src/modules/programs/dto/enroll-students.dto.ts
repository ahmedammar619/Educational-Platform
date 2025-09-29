import { IsArray, IsString } from 'class-validator';

export class EnrollStudentsDto {
  @IsArray()
  @IsString({ each: true })
  studentIds: string[];
}
