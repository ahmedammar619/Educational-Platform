import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Course } from '../../courses/entities/course.entity';
import { User } from '../../users/entities/user.entity';

@Entity('folders')
export class Folder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  courseId: string;

  @Column('uuid', { nullable: true })
  parentFolderId: string;

  @Column({ length: 255 })
  name: string;

  @Column('uuid')
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne('Course', 'folders')
  @JoinColumn({ name: 'courseId' })
  course: any;

  @ManyToOne('Folder', 'subFolders', { nullable: true })
  @JoinColumn({ name: 'parentFolderId' })
  parentFolder: any;

  @OneToMany('Folder', 'parentFolder')
  subFolders: any[];

  @OneToMany('File', 'folder')
  files: any[];

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'createdBy' })
  creator: User | null;
}
