import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Course } from '../../courses/entities/course.entity';
import { User } from '../../users/entities/user.entity';

@Entity('attendance')
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

  @Column({
    type: 'enum',
    enum: ['present', 'absent', 'late'],
    default: 'absent'
  })
  status: 'present' | 'absent' | 'late';

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

  @ManyToOne(() => User)
  @JoinColumn({ name: 'studentId' })
  student: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'markedBy' })
  marker: User;
}
