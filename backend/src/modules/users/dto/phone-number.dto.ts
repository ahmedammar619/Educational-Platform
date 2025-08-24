import { IsString, IsNotEmpty, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PhoneNumberDto {
  @ApiProperty({ description: 'Country code (e.g., +1, +44, +91)', example: '+1' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+\d{1,4}$/, { message: 'Country code must be in format +X or +XXX' })
  countryCode: string;

  @ApiProperty({ description: 'Phone number without country code', example: '5551234567' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{7,15}$/, { message: 'Phone number must be 7-15 digits' })
  number: string;
}
