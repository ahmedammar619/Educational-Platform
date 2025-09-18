import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class StudentLoginDto {
  @ApiProperty({ description: 'Student email address' })
  @IsString()
  email: string;

  @ApiProperty({ description: 'Student password', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;
}
