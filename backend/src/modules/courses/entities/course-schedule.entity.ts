import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Course } from './course.entity';

@Entity('course_schedules')
export class CourseSchedule {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 20 })
  day: string; // "Sunday", "Monday", "Tuesday", etc.

  @Column({ length: 5 })
  startTime: string; // "16:00" (24-hour format)

  @Column({ length: 5 })
  endTime: string; // "18:00"

  @Column({ type: 'varchar', length: 255, nullable: true })
  location: string; // Room number or Zoom link

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // ================= Relations =================

  @ManyToOne(() => Course, (course) => course.schedules, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'courseId' })
  course: Course;

  @Column()
  courseId: number;
}
