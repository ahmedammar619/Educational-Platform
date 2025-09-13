import { Expose, Type } from 'class-transformer';
import { Course } from '../../../courses/entities/course.entity';
import { User } from '../../../users/entities/user.entity';

export class StudentAttendanceResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  status: 'present' | 'absent';

  @Expose()
  markedAt?: Date;

  @Expose()
  markedBy?: string;

  @Expose()
  notes?: string;
}

export class BulkAttendanceResponseDto {
  @Expose()
  id: string;

  @Expose()
  courseId: string;

  @Expose()
  date: Date;

  @Expose()
  day: string;

  @Expose()
  time: string;

  @Expose()
  meetingId: string;

  @Expose()
  meetingName: string;

  @Expose()
  markedBy?: string;

  @Expose()
  markedAt?: Date;

  @Expose()
  @Type(() => StudentAttendanceResponseDto)
  students: StudentAttendanceResponseDto[];

  @Expose()
  @Type(() => Course)
  course?: Course;

  @Expose()
  @Type(() => User)
  marker?: User;
}
