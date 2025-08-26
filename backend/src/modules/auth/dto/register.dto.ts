// src/modules/auth/dto/register.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
  IsPhoneNumber,
  IsDateString,
  ValidateIf,
} from 'class-validator';
import { Role } from '../../../common/enums/role.enum';
import { IsEmailUnique } from '../../../common/validators/unique-email.validator';

export class RegisterDto {
  @ApiProperty({
    description: "User's first name",
    example: 'John',
  })
  @IsString()
  firstName: string;

  @ApiProperty({
    description: "User's last name",
    example: 'Doe',
  })
  @IsString()
  lastName: string;

  @ApiProperty({
    description: "User's email address",
    example: 'john.doe@example.com',
  })
  @IsEmail()
  @IsEmailUnique({ message: 'This email is already registered. Please use a different email address.' })
  email: string;

  @ApiProperty({
    description: "User's password (minimum 8 characters)",
    example: 'SecurePass123',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({
    description: "User's role in the system",
    enum: [Role.Student, Role.Parent],
    example: Role.Student,
  })
  @IsEnum(Role)
  role: Role;

  @ApiProperty({
    description: "User's phone number (required for students and parents)",
    example: '+1234567890',
    required: false,
  })
  @ValidateIf((o) => o.role === Role.Student || o.role === Role.Parent)
  @IsPhoneNumber()
  phone?: string;

  @ApiProperty({
    description: "User's birth date (required for students)",
    example: '2000-01-01',
    required: false,
  })
  @ValidateIf((o) => o.role === Role.Student)
  @IsDateString()
  birthDate?: string;
}
