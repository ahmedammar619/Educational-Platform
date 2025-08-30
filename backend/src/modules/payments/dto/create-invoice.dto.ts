import { IsString, IsNotEmpty, IsNumber, IsOptional, IsDateString } from 'class-validator';

export class CreateInvoiceDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  stripeInvoiceId: string;

  @IsString()
  @IsOptional()
  stripeSubscriptionId?: string;

  @IsNumber()
  @IsNotEmpty()
  amountPaid: number;

  @IsString()
  @IsNotEmpty()
  currency: string;

  @IsString()
  @IsNotEmpty()
  status: string;

  @IsDateString()
  @IsOptional()
  paidAt?: Date;
}
