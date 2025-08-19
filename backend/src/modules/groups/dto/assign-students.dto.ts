import { IsNumber, IsArray } from 'class-validator';

export class AssignStudentsDto {
  @IsNumber()
  groupId: number;

  @IsArray()
  studentIds: number[];
}
