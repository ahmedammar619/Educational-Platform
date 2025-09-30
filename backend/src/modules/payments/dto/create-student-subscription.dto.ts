import { IsString, IsUUID, IsOptional, IsEnum, IsNumber, IsBoolean } from 'class-validator';

export class CreateStudentSubscriptionDto {
  @IsUUID()
  studentId: string;

  @IsUUID()
  planId: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class BulkSubscribeDto {
  @IsUUID()
  studentId: string;

  @IsUUID('4', { each: true })
  planIds: string[];

  @IsString()
  @IsOptional()
  notes?: string;
}
