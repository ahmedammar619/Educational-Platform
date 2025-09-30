import { IsString, IsNumber, IsEnum, IsBoolean, IsOptional, IsArray, IsDateString, Min } from 'class-validator';
import { PlanType, BillingInterval } from '../entities/subscription-plan.entity';

export class CreateSubscriptionPlanDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(PlanType)
  planType: PlanType;

  @IsEnum(BillingInterval)
  billingInterval: BillingInterval;

  @IsNumber()
  @Min(0)
  price: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsBoolean()
  @IsOptional()
  isBasePlan?: boolean;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsNumber()
  @IsOptional()
  maxStudents?: number;

  @IsArray()
  @IsOptional()
  features?: string[];

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsNumber()
  @IsOptional()
  maxEnrollments?: number;

  @IsString()
  @IsOptional()
  category?: string;

  @IsNumber()
  @IsOptional()
  displayOrder?: number;
}
