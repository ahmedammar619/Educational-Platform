import { IsEmail, IsString, IsOptional, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmailUnique } from '../../../common/validators/unique-email.validator';

export class CreateParentDto {
  @ApiProperty({ description: 'Parent first name' })
  @IsString()
  firstName: string;

  @ApiProperty({ description: 'Parent last name' })
  @IsString()
  lastName: string;

  @ApiProperty({ description: 'Parent email address' })
  @IsEmail()
  @IsEmailUnique({ message: 'This email is already registered. Please use a different email address.' })
  email: string;

  @ApiProperty({ description: 'Parent password', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ description: 'Parent phone number (optional)' })
  @IsOptional()
  @IsString()
  phone?: string;
}
