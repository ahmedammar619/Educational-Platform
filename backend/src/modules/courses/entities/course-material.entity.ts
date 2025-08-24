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
import { Course } from './course.entity';
import { User } from '../../users/entities/user.entity';
import { MaterialAttachment } from './material-attachment.entity';
import { SessionMaterial } from './session-material.entity';

@Entity('course_materials')
export class CourseMaterial {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ['post', 'assignment', 'announcement', 'resource'],
    default: 'post'
  })
  type: 'post' | 'assignment' | 'announcement' | 'resource';

  @Column({ type: 'text' })
  content: string; // Rich text content

  @Column({ type: 'timestamp', nullable: true })
  publishDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  dueDate: Date; // For assignments

  @Column({ type: 'int', default: 0 })
  maxScore: number; // For assignments

  @Column({ type: 'boolean', default: false })
  allowSubmissions: boolean; // For assignments

  @Column({ type: 'boolean', default: false })
  allowComments: boolean;

  @Column({ type: 'boolean', default: false })
  isPinned: boolean;

  @Column({ type: 'int', default: 0 })
  viewCount: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    tags?: string[];
    difficulty?: string;
    estimatedTime?: number; // minutes
    prerequisites?: string[];
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // ================= Relations =================

  @ManyToOne(() => Course, (course) => course.materials, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'courseId' })
  course: Course;

  @Column()
  courseId: string; // Changed to string to match Course UUID

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'authorId' })
  author: User;

  @Column()
  authorId: string;

  @OneToMany(() => MaterialAttachment, (attachment) => attachment.material)
  attachments: MaterialAttachment[];

  @OneToMany(() => SessionMaterial, (sessionMaterial) => sessionMaterial.material)
  sessionMaterials: SessionMaterial[];
}
