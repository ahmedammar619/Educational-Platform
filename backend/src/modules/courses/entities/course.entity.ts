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
import { Class } from '../../classes/entities/class.entity';
import { User } from '../../users/entities/user.entity';

export interface SessionData {
  day: string;
  startTime: string;
  endTime: string;
}

@Entity('courses')
export class Course {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column('uuid', { nullable: true })
  teacherId: string | null;

  @Column('uuid')
  classId: string;

  @Column('json', { nullable: true })
  sessions: SessionData[];

  @Column({ type: 'simple-array', nullable: true, default: '' })
  students: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => Class, classEntity => classEntity.courses)
  @JoinColumn({ name: 'classId' })
  class: Class;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'teacherId' })
  teacher: User | null;

  @OneToMany('Post', 'course')
  posts: any[];

  @OneToMany('Folder', 'course')
  folders: any[];

  @OneToMany('File', 'course')
  files: any[];

  @OneToMany('Assignment', 'course')
  assignments: any[];

  @OneToMany('Attendance', 'course')
  attendance: any[];
}
