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
import { SessionAttendance } from './session-attendance.entity';
import { SessionMaterial } from './session-material.entity';

@Entity('course_sessions')
export class CourseSession {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'date' })
  scheduledDate: Date;

  @Column({ type: 'time' })
  startTime: string; // "16:00" (24-hour format)

  @Column({ type: 'time' })
  endTime: string; // "18:00"

  @Column({ type: 'varchar', length: 255, nullable: true })
  location: string; // Room number or Zoom link

  @Column({
    type: 'enum',
    enum: ['regular', 'custom', 'makeup', 'exam'],
    default: 'regular'
  })
  type: 'regular' | 'custom' | 'makeup' | 'exam';

  @Column({
    type: 'enum',
    enum: ['scheduled', 'completed', 'cancelled', 'rescheduled'],
    default: 'scheduled'
  })
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'int', default: 0 })
  maxAttendees: number;

  @Column({ type: 'boolean', default: false })
  isMandatory: boolean;

  @Column({ type: 'boolean', default: false })
  isRecorded: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  recordingUrl: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // ================= Relations =================

  @ManyToOne(() => Course, (course) => course.sessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'courseId' })
  course: Course;

  @Column()
  courseId: number;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'teacherId' })
  teacher: User;

  @Column()
  teacherId: number;

  @OneToMany(() => SessionAttendance, (attendance) => attendance.session)
  attendances: SessionAttendance[];

  @OneToMany(() => SessionMaterial, (material) => material.session)
  materials: SessionMaterial[];

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'createdBy' })
  createdBy: User;

  @Column()
  createdById: number;
}
