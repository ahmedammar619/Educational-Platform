import { IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';

export class GradeAssignmentDto {
  @IsNumber()
  @Min(0)
  @Max(100)
  grade: number;

  @IsOptional()
  @IsString()
  feedback?: string;
}
