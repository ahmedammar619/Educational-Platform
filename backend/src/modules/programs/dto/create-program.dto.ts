import { IsString, IsNumber, IsOptional, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProgramDto {
  @ApiProperty({
    description: 'Name of the program',
    example: 'Computer Science Program'
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Price of the program',
    example: 1500.00,
    type: Number
  })
  @IsNumber()
  price: number;

  @ApiProperty({
    description: 'Array of class IDs associated with this program',
    example: ['123e4567-e89b-12d3-a456-426614174001', '123e4567-e89b-12d3-a456-426614174002'],
    type: [String],
    required: false
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  classIds?: string[];

  @ApiProperty({
    description: 'Array of student IDs enrolled in this program',
    example: ['123e4567-e89b-12d3-a456-426614174003', '123e4567-e89b-12d3-a456-426614174004'],
    type: [String],
    required: false
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  studentIds?: string[];
}
