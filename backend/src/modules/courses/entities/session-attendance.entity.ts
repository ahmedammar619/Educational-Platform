import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CourseSession } from './course-session.entity';
import { User } from '../../users/entities/user.entity';

@Entity('session_attendance')
export class SessionAttendance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: ['present', 'absent', 'late', 'not_marked'],
    default: 'not_marked'
  })
  status: 'present' | 'absent' | 'late' | 'not_marked';

  @Column({ type: 'timestamp', nullable: true })
  checkInTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  checkOutTime: Date;

  @Column({ type: 'text', nullable: true })
  notes: string; // Teacher notes about attendance

  @Column({ type: 'boolean', default: false })
  isExcused: boolean;

  @Column({ type: 'text', nullable: true })
  excuseReason: string;

  @Column({ type: 'timestamp', nullable: true })
  markedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // ================= Relations =================

  @ManyToOne(() => CourseSession, (session) => session.attendances, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sessionId' })
  session: CourseSession;

  @Column()
  sessionId: string; // Changed to string to match CourseSession UUID

  @ManyToOne(() => User, (user) => user.attendances, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'studentId' })
  student: User;

  @Column()
  studentId: string;

  @ManyToOne(() => User, (user) => user.markedAttendances)
  @JoinColumn({ name: 'markedBy' })
  markedBy: User;

  @Column()
  markedById: string;
}
