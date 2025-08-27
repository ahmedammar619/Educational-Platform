import { IsOptional, IsString } from 'class-validator';

export class SubmitAssignmentDto {
  @IsOptional()
  @IsString()
  notes?: string;
}
