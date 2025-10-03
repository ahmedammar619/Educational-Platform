import { IsUUID, IsOptional, IsString } from 'class-validator';

export class EnrollStudentDto {
  @IsUUID()
  subscriptionId: string;

  @IsUUID()
  courseId: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class BulkEnrollDto {
  @IsUUID('4', { each: true })
  subscriptionIds: string[];

  @IsUUID()
  courseId: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
