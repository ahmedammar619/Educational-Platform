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
  Matches,
} from 'class-validator';
import { Role } from '../../../common/enums/role.enum';

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
  email: string;

  @ApiProperty({
    description: "User's password (must contain uppercase, lowercase, number, and special character)",
    example: 'SecurePass123!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    { 
      message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)' 
    }
  )
  password: string;

  @ApiProperty({
    description: "User's role in the system",
    enum: Role,
    default: Role.Student,
    required: false,
  })
  @IsEnum(Role)
  @IsOptional()
  role?: Role = Role.Student;

  @ApiProperty({
    description: "User's phone number (for parents and teachers)",
    example: '+1234567890',
    required: false,
  })
  @IsPhoneNumber()
  @IsOptional()
  phone?: string;

  @ApiProperty({
    description: "User's username (for students only)",
    example: 'johndoe123',
    required: false,
  })
  @IsString()
  @IsOptional()
  username?: string;

  @ApiProperty({
    description: "User's birth date (for students only)",
    example: '2000-01-01',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  birthDate?: string;
}
