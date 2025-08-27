import { IsArray, IsUUID, ArrayNotEmpty } from 'class-validator';

export class EnrollStudentsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  studentIds: string[];
}
