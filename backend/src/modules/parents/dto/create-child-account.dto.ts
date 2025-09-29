import { IsString, IsDateString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateChildAccountDto {
  @ApiProperty({ description: 'Child first name' })
  @IsString()
  firstName: string;

  @ApiProperty({ description: 'Child last name' })
  @IsString()
  lastName: string;

  @ApiProperty({ description: 'Child email address' })
  @IsString()
  email: string;

  @ApiProperty({ description: 'Child password', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ description: 'Child birth date (YYYY-MM-DD)' })
  @IsDateString()
  birthDate: string;

  @ApiProperty({ 
    description: 'Array of program IDs to enroll the child in (required)', 
    type: [String],
    required: true 
  })
  @IsString({ each: true })
  programIds: string[];
}
