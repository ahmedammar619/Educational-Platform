import { IsString, IsEnum, IsOptional, MinLength, ValidateIf, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../../common/enums/role.enum';
import { IsEmailUnique } from '../../../common/validators/unique-email.validator';
import { IsStudentField } from '../../../common/validators/student-field.validator';

export class UpdateUserDto {
  @ApiProperty({ description: 'User first name', required: false })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({ description: 'User last name', required: false })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ description: 'User email address', required: false })
  @IsOptional()
  @IsString()
  @IsEmailUnique({ message: 'This email is already registered. Please use a different email address.' })
  email?: string;

  @ApiProperty({ description: 'User password', minLength: 8, required: false })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @ApiProperty({ description: 'User role', enum: Role, required: false })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiProperty({ description: 'User phone number (required for teachers)' })
  @ValidateIf((o) => o.role === Role.Teacher)
  @IsString()
  phone?: string;

  @ApiProperty({ description: 'Student birth date (required for students)', required: false })
  @IsStudentField()
  @ValidateIf((o) => o.role === Role.Student)
  @IsDateString()
  birthDate?: string;

  @ApiProperty({ description: 'Parent ID (optional for students)', required: false })
  @IsStudentField()
  @ValidateIf((o) => o.role === Role.Student)
  @IsOptional()
  @IsString()
  parentId?: string;
}
