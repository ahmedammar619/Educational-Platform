import { ApiProperty } from '@nestjs/swagger';

export class TeacherResponseDto {
  @ApiProperty({
    description: 'Teacher ID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  id: string;

  @ApiProperty({
    description: 'Teacher first name',
    example: 'Ahmed'
  })
  firstName: string;

  @ApiProperty({
    description: 'Teacher last name',
    example: 'Mohammed'
  })
  lastName: string;

  @ApiProperty({
    description: 'Teacher email',
    example: 'ahmed.mohammed@example.com'
  })
  email: string;

  @ApiProperty({
    description: 'Teacher phone number',
    example: '+201234567890',
    nullable: true
  })
  phone?: string;

  @ApiProperty({
    description: 'Array of subjects the teacher teaches',
    example: ['Quran', 'Arabic', 'Islamic Studies']
  })
  subjects: string[];

  @ApiProperty({
    description: 'Account creation date',
    example: '2025-01-15T10:30:00.000Z'
  })
  createdAt: Date;
}
