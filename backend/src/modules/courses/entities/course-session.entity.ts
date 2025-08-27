import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Course } from './course.entity';

@Entity('course_sessions')
export class CourseSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  courseId: string;

  @Column({ length: 20 })
  day: string;

  @Column({ length: 5 })
  startTime: string;

  @Column({ length: 5 })
  endTime: string;

  @CreateDateColumn()
  createdAt: Date;

  // Relationships
  @ManyToOne('Course', 'sessions')
  @JoinColumn({ name: 'courseId' })
  course: any;
}
