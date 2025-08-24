import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Role } from '../../../common/enums/role.enum';
import { Parent } from '../../parents/entities/parent.entity';
import { Course } from '../../courses/entities/course.entity';
import { CourseEnrollment } from '../../courses/entities/course-enrollment.entity';
import { SessionAttendance } from '../../courses/entities/session-attendance.entity';
import { CourseMaterial } from '../../courses/entities/course-material.entity';
import { CourseFile } from '../../courses/entities/course-file.entity';
import { CourseFolder } from '../../courses/entities/course-folder.entity';
import { CourseSchedule } from '../../courses/entities/course-schedule.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  firstName: string;

  @Column({ length: 255 })
  lastName: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ unique: true, length: 255, nullable: true })
  username?: string; // Only for students

  @Column()
  @Exclude()
  passwordHash: string;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.Student,
  })
  role: Role;

  @Column({ nullable: true, length: 20 })
  phone?: string; // For parents and teachers - will store full phone with country code

  @Column({ type: 'date', nullable: true })
  birthDate?: Date; // Only for students - required when role is student

  // ================= Security Fields =================
  @Column({ type: 'timestamp', nullable: true })
  lastLogin?: Date;

  @Column({ nullable: true, length: 255 })
  resetToken?: string;

  @Column({ type: 'timestamp', nullable: true })
  resetTokenExpiry?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // ================= Relations =================

  // Parent/Child Relations
  @OneToMany(() => Parent, (p) => p.parent)
  children: Parent[]; // if this user is a parent, these are their children

  @OneToMany(() => Parent, (p) => p.child)
  parents: Parent[]; // if this user is a child, these are their parents

  // Course Relations
  @OneToMany(() => Course, (course) => course.teacher)
  taughtCourses: Course[]; // if this user is a teacher

  @OneToMany(() => CourseEnrollment, (enrollment) => enrollment.student)
  enrollments: CourseEnrollment[]; // if this user is a student

  @OneToMany(() => SessionAttendance, (attendance) => attendance.student)
  attendances: SessionAttendance[]; // if this user is a student

  @OneToMany(() => SessionAttendance, (attendance) => attendance.markedBy)
  markedAttendances: SessionAttendance[]; // if this user is a teacher/admin

  @OneToMany(() => CourseMaterial, (material) => material.author)
  authoredMaterials: CourseMaterial[]; // if this user is a teacher

  @OneToMany(() => CourseFile, (file) => file.uploadedBy)
  uploadedFiles: CourseFile[]; // if this user is a teacher

  @OneToMany(() => CourseFolder, (folder) => folder.createdBy)
  createdFolders: CourseFolder[]; // if this user is a teacher

  // Many-to-Many Relations
  @ManyToMany(() => Course)
  @JoinTable({
    name: 'course_students',
    joinColumn: { name: 'studentId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'courseId', referencedColumnName: 'id' },
  })
  enrolledCourses: Course[]; // if this user is a student

  // Schedule Relations
  @OneToMany(() => CourseSchedule, (schedule) => schedule.course)
  courseSchedules: CourseSchedule[]; // if this user is a teacher
}
