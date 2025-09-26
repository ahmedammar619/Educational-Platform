import { Expose, Type } from 'class-transformer';
import { User } from '../../users/entities/user.entity';

export class ClassResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  startDate: Date;

  @Expose()
  endDate: Date;

  @Expose()
  courseIds?: string[];

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  @Type(() => User)
  students?: User[];

  @Expose()
  studentCount?: number;
}
