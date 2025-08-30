import { IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';

export class CreateSubscriptionDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  stripeSubscriptionId: string;

  @IsString()
  @IsNotEmpty()
  status: string;

  @IsDateString()
  @IsOptional()
  currentPeriodStart?: Date;

  @IsDateString()
  @IsOptional()
  currentPeriodEnd?: Date;

  @IsDateString()
  @IsOptional()
  cancelAt?: Date;

  @IsDateString()
  @IsOptional()
  canceledAt?: Date;
}
