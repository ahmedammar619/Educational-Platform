import { IsNotEmpty, IsString } from 'class-validator';

export class UpdatePaymentDto {
  @IsString()
  @IsNotEmpty()
  paymentInfo: string;
}
