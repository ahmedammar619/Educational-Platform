import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Assignment } from './assignment.entity';
import { User } from '../../users/entities/user.entity';

@Entity('assignment_submissions')
export class AssignmentSubmission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  assignmentId: string;

  @Column('uuid')
  studentId: string;

  @Column({ length: 255 })
  fileName: string;

  @Column({ length: 500 })
  filePath: string;

  @Column('int')
  fileSize: number;

  @Column({ length: 100 })
  mimeType: string;

  @CreateDateColumn()
  submittedAt: Date;

  @Column('int', { nullable: true })
  grade: number;

  @Column('text', { nullable: true })
  feedback: string;

  @Column('uuid', { nullable: true })
  gradedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  gradedAt: Date;

  // Relationships
  @ManyToOne('Assignment', 'submissions')
  @JoinColumn({ name: 'assignmentId' })
  assignment: any;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'studentId' })
  student: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'gradedBy' })
  grader: User;
}
