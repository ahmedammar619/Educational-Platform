import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { CourseSession } from './course-session.entity';
import { CourseMaterial } from './course-material.entity';
import { CourseFile } from './course-file.entity';
import { CourseFolder } from './course-folder.entity';
import { CourseEnrollment } from './course-enrollment.entity';
import { CourseSchedule } from './course-schedule.entity';

@Entity('courses')
export class Course {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number; // USD currency

  @Column({ type: 'int' })
  numberOfSessions: number;

  @Column({ type: 'int' })
  sessionDuration: number; // minutes

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date' })
  endDate: Date;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', nullable: true })
  schedule: {
    day: string; // "Sunday", "Monday", etc.
    startTime: string; // "16:00" (24-hour format)
    endTime: string; // "18:00"
  }[];

  @CreateDateColumn()
  createdAt: Date;

  // ================= Relations =================

  @ManyToOne(() => User, { eager: true })
  teacher: User;

  @Column()
  teacherId: string;

  @OneToMany(() => CourseSession, (session) => session.course)
  sessions: CourseSession[];

  @OneToMany(() => CourseSchedule, (schedule) => schedule.course)
  schedules: CourseSchedule[];

  @OneToMany(() => CourseMaterial, (material) => material.course)
  materials: CourseMaterial[];

  @OneToMany(() => CourseFile, (file) => file.course)
  files: CourseFile[];

  @OneToMany(() => CourseFolder, (folder) => folder.course)
  folders: CourseFolder[];

  @OneToMany(() => CourseEnrollment, (enrollment) => enrollment.course)
  enrollments: CourseEnrollment[];

  @ManyToMany(() => User)
  @JoinTable({
    name: 'course_students',
    joinColumn: { name: 'courseId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'studentId', referencedColumnName: 'id' },
  })
  students: User[];
}
