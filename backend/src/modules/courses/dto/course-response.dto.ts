import { Expose } from 'class-transformer';

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
}
