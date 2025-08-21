import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString, IsPhoneNumber } from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({
    description: "User's first name",
    example: 'John',
    required: false,
  })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiProperty({
    description: "User's last name",
    example: 'Doe',
    required: false,
  })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiProperty({
    description: "User's phone number",
    example: '+1234567890',
    required: false,
  })
  @IsPhoneNumber()
  @IsOptional()
  phone?: string;

  @ApiProperty({
    description: "User's birth date (for students)",
    example: '2000-01-01',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  birthDate?: string;

  @ApiProperty({
    description: "User's username (for students)",
    example: 'johndoe123',
    required: false,
  })
  @IsString()
  @IsOptional()
  username?: string;
}