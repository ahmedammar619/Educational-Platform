import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Course } from '../../courses/entities/course.entity';
import { User } from '../../users/entities/user.entity';

@Entity('attendance')
@Unique(['courseId', 'studentId', 'meetingId'])
export class Attendance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  courseId: string;

  @Column('uuid')
  studentId: string;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'varchar', length: 20, nullable: true })
  day: string; // e.g., 'Monday', 'Wednesday', 'Friday'

  @Column({ type: 'varchar', length: 20, nullable: true })
  time: string; // e.g., '09:00-11:00', '14:00-16:00', '10:00-12:00'

  @Column({ type: 'uuid', nullable: true })
  meetingId: string; // ID of the Zoom meeting

  @Column({
    type: 'enum',
    enum: ['present', 'absent'],
    default: 'absent'
  })
  status: 'present' | 'absent';

  @Column('uuid')
  markedBy: string;

  @CreateDateColumn()
  markedAt: Date;

  @Column('text', { nullable: true })
  notes: string;

  // Relationships
  @ManyToOne('Course', 'attendance')
  @JoinColumn({ name: 'courseId' })
  course: any;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'studentId' })
  student: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'markedBy' })
  marker: User | null;

  @ManyToOne('ZoomMeeting', 'attendance')
  @JoinColumn({ name: 'meetingId' })
  meeting: any;
}
