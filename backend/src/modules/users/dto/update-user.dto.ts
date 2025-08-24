import { IsEmail, IsString, IsEnum, IsOptional, MinLength, IsDateString, ValidateIf } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../../common/enums/role.enum';

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
  @IsEmail()
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

  @ApiProperty({ description: 'User phone number (required for teachers and parents)' })
  @ValidateIf((o) => o.role === Role.Teacher || o.role === Role.Parent)
  @IsString()
  phone?: string;

  @ApiProperty({ description: 'Birth date (required for students)' })
  @ValidateIf((o) => o.role === Role.Student)
  @IsDateString()
  birthDate?: string;
}
