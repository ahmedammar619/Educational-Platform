import { IsEmail, IsString, IsDateString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateChildAccountDto {
  @ApiProperty({ description: 'Child first name' })
  @IsString()
  firstName: string;

  @ApiProperty({ description: 'Child last name' })
  @IsString()
  lastName: string;

  @ApiProperty({ description: 'Child email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Child password', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ description: 'Child birth date (YYYY-MM-DD)' })
  @IsDateString()
  birthDate: string;
}
