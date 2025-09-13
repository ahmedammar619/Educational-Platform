import { IsEmail, IsString, IsEnum, IsOptional, MinLength, ValidateIf, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../../common/enums/role.enum';
import { IsEmailUnique } from '../../../common/validators/unique-email.validator';

export class CreateUserDto {
  @ApiProperty({ description: 'User first name' })
  @IsString()
  firstName: string;

  @ApiProperty({ description: 'User last name' })
  @IsString()
  lastName: string;

  @ApiProperty({ description: 'User email address' })
  @IsEmail()
  @IsEmailUnique({ message: 'This email is already registered. Please use a different email address.' })
  email: string;

  @ApiProperty({ description: 'User password', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ description: 'User role', enum: Role })
  @IsEnum(Role)
  role: Role;

  @ApiProperty({ description: 'User phone number (required for teachers)' })
  @ValidateIf((o) => o.role === Role.Teacher)
  @IsString()
  phone: string;

  @ApiProperty({ description: 'Student birth date (required for students)', required: false })
  @ValidateIf((o) => o.role === Role.Student)
  @IsDateString()
  birthDate?: string;

  @ApiProperty({ description: 'Parent ID (optional for students)', required: false })
  @ValidateIf((o) => o.role === Role.Student)
  @IsOptional()
  @IsString()
  parentId?: string;
}
