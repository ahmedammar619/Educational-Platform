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
import { Course } from '../../courses/entities/course.entity';
import { User } from '../../users/entities/user.entity';

@Entity('assignments')
export class Assignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  courseId: string;

  @Column('uuid')
  createdBy: string;

  @Column({ length: 255 })
  name: string;

  @Column('text')
  description: string;

  @Column({ type: 'date' })
  dueDate: Date;

  @Column({ type: 'time' })
  dueTime: string;

  @Column('int')
  marks: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne('Course', 'assignments')
  @JoinColumn({ name: 'courseId' })
  course: any;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'createdBy' })
  creator: User | null;

  @OneToMany('AssignmentSubmission', 'assignment')
  submissions: any[];
}
