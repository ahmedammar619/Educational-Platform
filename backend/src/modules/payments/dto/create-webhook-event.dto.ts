import { IsString, IsNotEmpty, IsObject } from 'class-validator';

export class CreateWebhookEventDto {
  @IsString()
  @IsNotEmpty()
  stripeEventId: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsObject()
  @IsNotEmpty()
  payload: any;
}
