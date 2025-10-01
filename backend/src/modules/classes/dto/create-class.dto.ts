import { IsString, IsNotEmpty, Length, IsDateString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateClassDto {
  @ApiProperty({
    description: 'Name of the class',
    example: 'Mathematics 101',
    minLength: 1,
    maxLength: 255
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  name: string;

  @ApiProperty({
    description: 'Start date of the class',
    example: '2024-01-15',
    format: 'date'
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: 'End date of the class',
    example: '2024-06-15',
    format: 'date'
  })
  @IsDateString()
  endDate: string;

}
