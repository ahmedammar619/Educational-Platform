import { IsEmail, IsString, IsOptional, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateParentDto {
  @ApiProperty({ description: 'Parent first name' })
  @IsString()
  firstName: string;

  @ApiProperty({ description: 'Parent last name' })
  @IsString()
  lastName: string;

  @ApiProperty({ description: 'Parent email address' })
  @IsEmail()
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
