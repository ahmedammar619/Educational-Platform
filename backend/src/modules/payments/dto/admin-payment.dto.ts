import { IsString, IsUUID, IsOptional, IsEnum, IsNumber, IsDateString } from 'class-validator';
import { PaymentStatus } from '../entities/payment.entity';

export class UpdateStudentSubscriptionDto {
  @IsEnum(PaymentStatus)
  @IsOptional()
  status?: PaymentStatus;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsDateString()
  @IsOptional()
  currentPeriodStart?: string;

  @IsDateString()
  @IsOptional()
  currentPeriodEnd?: string;
}

export class CreateManualPaymentDto {
  @IsUUID()
  studentId: string;

  @IsUUID()
  planId: string;

  @IsNumber()
  amountPaid: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsDateString()
  @IsOptional()
  paidAt?: string;
}

export class RefundPaymentDto {
  @IsNumber()
  @IsOptional()
  amount?: number;

  @IsString()
  @IsOptional()
  reason?: string;
}
