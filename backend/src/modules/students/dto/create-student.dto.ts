import { IsEmail, IsString, IsOptional, MinLength, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmailUnique } from '../../../common/validators/unique-email.validator';

export class CreateStudentDto {
  @ApiProperty({ description: 'Student first name' })
  @IsString()
  firstName: string;

  @ApiProperty({ description: 'Student last name' })
  @IsString()
  lastName: string;

  @ApiProperty({ description: 'Student email address' })
  @IsEmail()
  @IsEmailUnique({ message: 'This email is already registered. Please use a different email address.' })
  email: string;

  @ApiProperty({ description: 'Student password', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ description: 'Student birth date (YYYY-MM-DD)' })
  @IsDateString()
  birthDate: string;

  @ApiProperty({ description: 'Student phone number (optional - not required when created by parent)' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ description: 'Parent ID (optional - only if created by parent)' })
  @IsOptional()
  @IsString()
  parentId?: string;
}
