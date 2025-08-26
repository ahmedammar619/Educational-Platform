import { IsEmail, IsString, IsOptional, MinLength, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateStudentDto {
  @ApiProperty({ description: 'Student first name' })
  @IsString()
  firstName: string;

  @ApiProperty({ description: 'Student last name' })
  @IsString()
  lastName: string;

  @ApiProperty({ description: 'Student email address' })
  @IsEmail()
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
