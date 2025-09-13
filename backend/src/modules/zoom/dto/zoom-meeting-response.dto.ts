import { Expose, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  firstName: string;

  @ApiProperty()
  @Expose()
  lastName: string;

  @ApiProperty()
  @Expose()
  email: string;

  @ApiProperty()
  @Expose()
  role: string;

  @ApiProperty()
  @Expose()
  get name(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}

export class CourseResponseDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  name: string;
}

export class ZoomMeetingResponseDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  title: string;

  @ApiPropertyOptional()
  @Expose()
  description?: string;

  @ApiProperty()
  @Expose()
  invitationLink: string;

  @ApiPropertyOptional()
  @Expose()
  zoomMeetingId?: string;

  @ApiPropertyOptional()
  @Expose()
  zoomPassword?: string;

  @ApiPropertyOptional()
  @Expose()
  zoomStartUrl?: string;

  @ApiPropertyOptional()
  @Expose()
  date?: string;

  @ApiPropertyOptional()
  @Expose()
  time?: string;

  @ApiPropertyOptional()
  @Expose()
  period?: string;

  @ApiProperty()
  @Expose()
  joinCount: number;

  @ApiProperty()
  @Expose()
  status: string;

  @ApiProperty()
  @Expose()
  @Type(() => UserResponseDto)
  createdBy: UserResponseDto;

  @ApiProperty()
  @Expose()
  @Type(() => CourseResponseDto)
  course: CourseResponseDto;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;
}
