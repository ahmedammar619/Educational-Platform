import { ApiProperty } from '@nestjs/swagger';

export class TeacherResponseDto {
  @ApiProperty({
    description: 'Teacher ID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  id: string;

  @ApiProperty({
    description: 'Array of courses the teacher teaches',
    example: ['Mathematics', 'Physics'],
    type: [String]
  })
  courses: string[];

  @ApiProperty({
    description: 'Associated user information',
    type: 'object'
  })
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    role: string;
    createdAt: string;
  };
}
