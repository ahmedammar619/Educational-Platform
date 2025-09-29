import { ApiProperty } from '@nestjs/swagger';

export class ProgramResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the program',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid'
  })
  id: string;

  @ApiProperty({
    description: 'Name of the program',
    example: 'Computer Science Program'
  })
  name: string;

  @ApiProperty({
    description: 'Price of the program',
    example: 1500.00,
    type: Number
  })
  price: number;

  @ApiProperty({
    description: 'Array of class IDs associated with this program',
    example: ['123e4567-e89b-12d3-a456-426614174001', '123e4567-e89b-12d3-a456-426614174002'],
    type: [String]
  })
  classIds: string[];

  @ApiProperty({
    description: 'Array of student IDs enrolled in this program',
    example: ['123e4567-e89b-12d3-a456-426614174003', '123e4567-e89b-12d3-a456-426614174004'],
    type: [String]
  })
  studentIds: string[];

  @ApiProperty({
    description: 'Date when the program was created',
    example: '2024-01-01T00:00:00.000Z',
    type: Date
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Date when the program was last updated',
    example: '2024-01-01T00:00:00.000Z',
    type: Date
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Array of class objects associated with this program',
    type: [Object],
    required: false
  })
  classes?: any[];
}
