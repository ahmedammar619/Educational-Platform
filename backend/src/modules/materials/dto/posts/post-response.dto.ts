import { Expose, Type } from 'class-transformer';
import { Course } from '../../../courses/entities/course.entity';
import { User } from '../../../users/entities/user.entity';
import { PostAttachment } from '../../entities/post-attachment.entity';

export class PostResponseDto {
  @Expose()
  id: string;

  @Expose()
  courseId: string;

  @Expose()
  authorId: string;

  @Expose()
  subject: string;

  @Expose()
  description: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  @Type(() => Course)
  course?: Course;

  @Expose()
  @Type(() => User)
  author?: User;

  @Expose()
  @Type(() => PostAttachment)
  attachments?: PostAttachment[];
}
