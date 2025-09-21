import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Course } from '../../courses/entities/course.entity';
import { User } from '../../users/entities/user.entity';

@Entity('files')
export class File {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  courseId: string;

  @Column('uuid', { nullable: true })
  folderId: string;

  @Column({ length: 255 })
  fileName: string;

  @Column({ length: 1000 })
  filePath: string;

  @Column('int')
  fileSize: number;

  @Column({ length: 100 })
  mimeType: string;

  @Column('uuid', { nullable: true })
  uploadedBy: string;

  @CreateDateColumn()
  uploadedAt: Date;

  // Relationships
  @ManyToOne('Course', 'files')
  @JoinColumn({ name: 'courseId' })
  course: any;

  @ManyToOne('Folder', 'files', { nullable: true })
  @JoinColumn({ name: 'folderId' })
  folder: any;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'uploadedBy' })
  uploader: User | null;
}
