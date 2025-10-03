import { Expose, Type } from 'class-transformer';
import { User } from '../../users/entities/user.entity';

export class CourseResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  teacherId: string;

  @Expose()
  teacherName?: string;

  @Expose()
  classId: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  sessions?: any[];

  @Expose()
  @Type(() => User)
  enrolledStudents?: User[];

  @Expose()
  creatorTimezone?: string;
}
