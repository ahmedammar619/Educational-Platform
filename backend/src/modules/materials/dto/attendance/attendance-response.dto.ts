import { Expose, Type } from 'class-transformer';
import { Course } from '../../../courses/entities/course.entity';
import { User } from '../../../users/entities/user.entity';

export class AttendanceResponseDto {
  @Expose()
  id: string;

  @Expose()
  courseId: string;

  @Expose()
  studentId: string;

  @Expose()
  date: Date;

  @Expose()
  status: 'present' | 'absent';

  @Expose()
  markedBy: string;

  @Expose()
  markedAt: Date;

  @Expose()
  notes?: string;

  @Expose()
  @Type(() => Course)
  course?: Course;

  @Expose()
  @Type(() => User)
  student?: User;

  @Expose()
  @Type(() => User)
  marker?: User;
}
