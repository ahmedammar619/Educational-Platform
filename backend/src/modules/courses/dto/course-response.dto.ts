import { Expose, Type } from 'class-transformer';
import { Class } from '../../classes/entities/class.entity';
import { User } from '../../users/entities/user.entity';
import { CourseSession } from '../entities/course-session.entity';

export class CourseResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  teacherId: string;

  @Expose()
  classId: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  @Type(() => Class)
  class?: Class;

  @Expose()
  @Type(() => User)
  teacher?: User;

  @Expose()
  @Type(() => CourseSession)
  sessions?: CourseSession[];
}
