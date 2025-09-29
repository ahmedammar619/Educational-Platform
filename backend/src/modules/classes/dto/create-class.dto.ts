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

  @ApiProperty({
    description: 'ID of the program this class belongs to (optional)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
    format: 'uuid'
  })
  @IsOptional()
  @IsUUID()
  programId?: string;
}
