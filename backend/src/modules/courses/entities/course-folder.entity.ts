import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinColumn,
  JoinTable,
} from 'typeorm';
import { Course } from './course.entity';
import { User } from '../../users/entities/user.entity';
import { CourseFile } from './course-file.entity';

@Entity('course_folders')
export class CourseFolder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  color: string; // Hex color for UI

  @Column({ type: 'varchar', length: 50, nullable: true })
  icon: string; // Icon name for UI

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ default: true })
  isPublic: boolean;

  @Column({ type: 'boolean', default: false })
  isDeleted: boolean;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // ================= Relations =================

  @ManyToOne(() => Course, (course) => course.folders, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'courseId' })
  course: Course;

  @Column()
  courseId: string; // Changed to string to match Course UUID

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'createdBy' })
  createdBy: User;

  @Column()
  createdById: string;

  @ManyToOne(() => CourseFolder, (folder) => folder.subFolders, { nullable: true })
  @JoinColumn({ name: 'parentFolderId' })
  parentFolder: CourseFolder;

  @Column({ nullable: true })
  parentFolderId: string; // Changed to string to match UUID pattern

  @OneToMany(() => CourseFolder, (folder) => folder.parentFolder)
  subFolders: CourseFolder[];

  @ManyToMany(() => CourseFile)
  @JoinTable({
    name: 'folder_files',
    joinColumn: { name: 'folderId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'fileId', referencedColumnName: 'id' },
  })
  files: CourseFile[];
}
