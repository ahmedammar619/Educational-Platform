import { Expose, Type } from 'class-transformer';
import { Course } from '../../../courses/entities/course.entity';
import { User } from '../../../users/entities/user.entity';
import { AssignmentSubmissionResponseDto } from './assignment-submission-response.dto';

export class AssignmentResponseDto {
  @Expose()
  id: string;

  @Expose()
  courseId: string;

  @Expose()
  createdBy: string;

  @Expose()
  name: string;

  @Expose()
  description: string;

  @Expose()
  dueDate: Date;

  @Expose()
  dueTime: string;

  @Expose()
  marks: number;

  @Expose()
  creatorTimezone?: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  @Type(() => Course)
  course?: Course;

  @Expose()
  @Type(() => User)
  creator?: User;

  @Expose()
  @Type(() => AssignmentSubmissionResponseDto)
  submissions?: AssignmentSubmissionResponseDto[];

  @Expose()
  submissionCount?: number;
}
