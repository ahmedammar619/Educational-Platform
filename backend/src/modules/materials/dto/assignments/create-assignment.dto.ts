import { IsString, IsNotEmpty, Length, IsDateString, IsNumber, Min, Matches, IsOptional } from 'class-validator';

export class CreateAssignmentDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsDateString()
  dueDate: string;

  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  dueTime: string; // Format: '23:59', '14:30', etc.

  @IsNumber()
  @Min(1)
  marks: number;

  @IsOptional()
  @IsString()
  creatorTimezone?: string;
}
