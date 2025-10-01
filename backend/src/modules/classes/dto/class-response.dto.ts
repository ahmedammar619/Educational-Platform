import { Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';

export class ClassResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the class',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid'
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Name of the class',
    example: 'Mathematics 101'
  })
  @Expose()
  name: string;

  @ApiProperty({
    description: 'Start date of the class',
    example: '2024-01-15T00:00:00.000Z',
    type: Date
  })
  @Expose()
  startDate: Date;

  @ApiProperty({
    description: 'End date of the class',
    example: '2024-06-15T00:00:00.000Z',
    type: Date
  })
  @Expose()
  endDate: Date;

  @ApiProperty({
    description: 'Array of course IDs associated with this class',
    example: ['123e4567-e89b-12d3-a456-426614174001', '123e4567-e89b-12d3-a456-426614174002'],
    type: [String],
    required: false
  })
  @Expose()
  courseIds?: string[];


  @ApiProperty({
    description: 'Date when the class was created',
    example: '2024-01-01T00:00:00.000Z',
    type: Date
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    description: 'Date when the class was last updated',
    example: '2024-01-01T00:00:00.000Z',
    type: Date
  })
  @Expose()
  updatedAt: Date;

  @ApiProperty({
    description: 'Number of students enrolled in this class',
    example: 25,
    required: false
  })
  @Expose()
  numberOfStudents?: number;
}
