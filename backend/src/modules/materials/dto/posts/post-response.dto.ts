import { Expose, Type } from 'class-transformer';
import { Course } from '../../../courses/entities/course.entity';

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
  author?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };

  @Expose()
  attachments?: {
    id: string;
    postId: string;
    fileName: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
    uploadedAt: Date;
  }[];
}
