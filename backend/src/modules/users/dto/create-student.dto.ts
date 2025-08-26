import { IsEmail, IsString, IsOptional, MinLength, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../../common/enums/role.enum';

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

  @ApiProperty({ description: 'Student password', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ description: 'Student birth date', required: true })
  @IsDateString()
  birthDate: string;

  @ApiProperty({ description: 'Parent ID (optional, when created by parent)', required: false })
  @IsOptional()
  @IsString()
  parentId?: string;
}
