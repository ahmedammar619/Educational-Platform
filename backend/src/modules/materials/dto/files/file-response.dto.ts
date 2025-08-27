import { Expose, Type } from 'class-transformer';
import { Course } from '../../../courses/entities/course.entity';
import { User } from '../../../users/entities/user.entity';
import { Folder } from '../../entities/folder.entity';

export class FileResponseDto {
  @Expose()
  id: string;

  @Expose()
  courseId: string;

  @Expose()
  folderId?: string;

  @Expose()
  fileName: string;

  @Expose()
  filePath: string;

  @Expose()
  fileSize: number;

  @Expose()
  mimeType: string;

  @Expose()
  uploadedBy: string;

  @Expose()
  uploadedAt: Date;

  @Expose()
  @Type(() => Course)
  course?: Course;

  @Expose()
  @Type(() => User)
  uploader?: User;

  @Expose()
  @Type(() => Folder)
  folder?: Folder;
}
