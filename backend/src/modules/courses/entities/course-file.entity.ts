import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  ManyToMany,
  JoinColumn,
  JoinTable,
} from 'typeorm';
import { Course } from './course.entity';
import { User } from '../../users/entities/user.entity';
import { CourseFolder } from './course-folder.entity';

@Entity('course_files')
export class CourseFile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  fileName: string; // System filename

  @Column({ length: 255 })
  originalName: string; // Original filename

  @Column({ type: 'bigint' })
  fileSize: number; // in bytes

  @Column({ length: 100 })
  mimeType: string;

  @Column({ length: 500 })
  filePath: string; // Storage path

  @Column({ length: 500, nullable: true })
  fileUrl: string; // Public URL if applicable

  @Column({ default: true })
  isPublic: boolean;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  tags: string[];

  @Column({ type: 'int', default: 0 })
  downloadCount: number;

  @Column({ type: 'int', default: 0 })
  viewCount: number;

  @Column({ type: 'boolean', default: false })
  isDeleted: boolean;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // ================= Relations =================

  @ManyToOne(() => Course, (course) => course.files, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'courseId' })
  course: Course;

  @Column()
  courseId: number;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'uploadedBy' })
  uploadedBy: User;

  @Column()
  uploadedById: number;

  @ManyToMany(() => CourseFolder)
  @JoinTable({
    name: 'file_folders',
    joinColumn: { name: 'fileId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'folderId', referencedColumnName: 'id' },
  })
  folders: CourseFolder[];
}
